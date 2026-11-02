/**
 * Background crawler that keeps every active World of Tanks player tracked, whether or not they
 * ever visited the site. Runs from GitHub Actions (.github/workflows/crawler.yml).
 *
 *  1. Discovery: sweeps the account ID space of each region 100 IDs at a time and queues every
 *     account that played within CRAWL_ACTIVE_DAYS.
 *  2. Update: re-checks queued accounts in batches of 100 (account/info). Accounts whose battle
 *     count changed get their per-tank battle counts from a single batched account/tanks call, a
 *     daily aggregate snapshot is stored and the leaderboard row (day / week / month) is refreshed.
 *     Cost: ~2 requests per 100 players.
 *
 * Env: DATABASE_URL, WARGAMING_APPLICATION_ID
 * Optional: CRAWL_REGIONS (eu,com,asia), CRAWL_MINUTES (10), WG_RPS (10), CRAWL_ACTIVE_DAYS (30),
 *           CRAWL_MIN_BATTLES (100), CRAWL_WORKERS (4)
 */
import {
  A,
  aggRatings,
  buildFastAgg,
  periodFromAgg,
  pickAggBaseline,
  utcDay,
  type AccountTotals,
  type AggSnapshot,
} from "@/lib/aggregate"
import { pool } from "@/lib/db"
import { PERIODS } from "@/lib/tracking"
import type { Region } from "@/lib/types"
import { getWn8Expected, REGIONS, wnxExpected, type Wn8ExpMap } from "@/lib/wargaming"

const env = (key: string, fallback: string) => process.env[key] || fallback
const REGION_LIST = env("CRAWL_REGIONS", "eu")
  .split(",")
  .map((r) => r.trim())
  .filter((r): r is Region => r in REGIONS)
const DEADLINE = Date.now() + Number(env("CRAWL_MINUTES", "10")) * 60_000
const RPS = Number(env("WG_RPS", "10"))
const ACTIVE_DAYS = Number(env("CRAWL_ACTIVE_DAYS", "30"))
const MIN_BATTLES = Number(env("CRAWL_MIN_BATTLES", "100"))
const WORKERS = Number(env("CRAWL_WORKERS", "4"))

const ID_START: Record<Region, number> = { eu: 500_000_000, com: 1_000_000_000, asia: 2_000_000_000 }
/** Consecutive empty 100-ID batches after which we assume the end of the ID space and wrap around. */
const END_STREAK = 500
const DAY = 86_400_000

const timeLeft = () => DEADLINE - Date.now()
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ---------- Rate-limited Wargaming client ----------

let nextSlot = 0
async function throttle() {
  const now = Date.now()
  const slot = Math.max(now, nextSlot)
  nextSlot = slot + 1000 / RPS
  if (slot > now) await sleep(slot - now)
}

const stats = { requests: 0, discovered: 0, scanned: 0, checked: 0, changed: 0, errors: 0 }

async function wg<T>(region: Region, path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`https://${REGIONS[region].host}/wot/${path}/`)
  url.searchParams.set("application_id", process.env.WARGAMING_APPLICATION_ID!)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  for (let attempt = 0; ; attempt++) {
    await throttle()
    stats.requests++
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
      const json = res.ok ? await res.json() : null
      if (json?.status === "ok") return json.data as T
      const message: string = json?.error?.message ?? `HTTP ${res.status}`
      const retryable = !json || /REQUEST_LIMIT_EXCEEDED|SOURCE_NOT_AVAILABLE/.test(message)
      if (!retryable || attempt >= 4) throw new Error(`${path}: ${message}`)
    } catch (error) {
      if (attempt >= 4) throw error
    }
    await sleep(1000 * 2 ** attempt)
  }
}

// ---------- Discovery ----------

async function claimCursor(region: Region) {
  const key = `discover:${region}`
  const { rows } = await pool.query<{ cursor: string }>(
    `INSERT INTO crawl_state (key, cursor) VALUES ($1, $2 + 100)
     ON CONFLICT (key) DO UPDATE SET cursor = crawl_state.cursor + 100, updated_at = now()
     RETURNING cursor - 100 AS cursor`,
    [key, ID_START[region]],
  )
  return Number(rows[0].cursor)
}

async function recordStreak(region: Region, empty: boolean) {
  const key = `discover:${region}`
  const { rows } = await pool.query<{ empty_streak: number }>(
    `UPDATE crawl_state SET empty_streak = CASE WHEN $2 THEN empty_streak + 1 ELSE 0 END
     WHERE key = $1 RETURNING empty_streak`,
    [key, empty],
  )
  if ((rows[0]?.empty_streak ?? 0) >= END_STREAK) {
    console.log(`[crawler] ${region}: reached end of ID space, restarting sweep`)
    await pool.query(`UPDATE crawl_state SET cursor = $2, empty_streak = 0 WHERE key = $1`, [key, ID_START[region]])
  }
}

interface BriefAccount {
  nickname: string
  last_battle_time: number
  statistics: { random: { battles: number } }
}

async function discoverBatch(region: Region) {
  const start = await claimCursor(region)
  const ids = Array.from({ length: 100 }, (_, i) => start + i)
  const data = await wg<Record<string, BriefAccount | null>>(region, "account/info", {
    account_id: ids.join(","),
    extra: "statistics.random",
    fields: "nickname,last_battle_time,statistics.random.battles",
  })
  stats.scanned += ids.length

  const activeSince = Date.now() / 1000 - ACTIVE_DAYS * 86400
  const found = Object.entries(data).filter(
    ([, a]) => a && a.last_battle_time >= activeSince && a.statistics.random.battles >= MIN_BATTLES,
  ) as [string, BriefAccount][]
  await recordStreak(region, !Object.values(data).some(Boolean))
  if (!found.length) return

  const values: unknown[] = []
  const tuples = found.map(([id, a], i) => {
    values.push(region, Number(id), a.nickname, new Date(a.last_battle_time * 1000))
    const o = i * 4
    return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4})`
  })
  const res = await pool.query(
    `INSERT INTO crawl_accounts (region, account_id, nickname, last_battle_at)
     VALUES ${tuples.join(",")} ON CONFLICT DO NOTHING`,
    values,
  )
  stats.discovered += res.rowCount ?? 0
}

// ---------- Update ----------

interface QueuedAccount {
  account_id: string
  battles: number
}

/** Atomically claims due accounts so parallel workers never process the same player. */
async function claimDue(region: Region): Promise<QueuedAccount[]> {
  const { rows } = await pool.query<QueuedAccount>(
    `UPDATE crawl_accounts c SET next_check_at = now() + interval '1 hour'
     FROM (
       SELECT account_id FROM crawl_accounts
       WHERE region = $1 AND next_check_at <= now()
       ORDER BY next_check_at LIMIT 100
       FOR UPDATE SKIP LOCKED
     ) due
     WHERE c.region = $1 AND c.account_id = due.account_id
     RETURNING c.account_id, c.battles`,
    [region],
  )
  return rows
}

interface FullAccount {
  nickname: string
  global_rating: number
  last_battle_time: number
  clan_id: number | null
  statistics: {
    random: {
      battles: number
      wins: number
      damage_dealt: number
      frags: number
      spotted: number
      dropped_capture_points: number
      radio_assisted_damage: number
      track_assisted_damage: number
    }
  }
}

type AccountTanks = Record<string, { tank_id: number; statistics: { battles: number } }[] | null>

const HOUR = 3600_000

/** Active players are re-checked several times a day so each UTC day gets its own snapshot. */
function nextCheckDelay(lastBattleAt: number) {
  const idle = Date.now() - lastBattleAt * 1000
  if (idle < 2 * DAY) return 3 * HOUR
  if (idle < 7 * DAY) return 8 * HOUR
  if (idle < ACTIVE_DAYS * DAY) return DAY
  return 4 * DAY
}

function totalsOf(acc: FullAccount): AccountTotals {
  const r = acc.statistics.random
  return {
    battles: r.battles,
    wins: r.wins,
    damage: r.damage_dealt,
    frags: r.frags,
    spots: r.spotted,
    def: r.dropped_capture_points,
    assist: r.radio_assisted_damage + r.track_assisted_damage,
  }
}

async function updateBatch(region: Region, wn8Exp: Wn8ExpMap) {
  const queued = await claimDue(region)
  if (!queued.length) return false

  const ids = queued.map((q) => Number(q.account_id))
  const info = await wg<Record<string, FullAccount | null>>(region, "account/info", {
    account_id: ids.join(","),
    extra: "statistics.random",
    fields: [
      "nickname,global_rating,last_battle_time,clan_id",
      ...["battles", "wins", "damage_dealt", "frags", "spotted", "dropped_capture_points"],
      ...["radio_assisted_damage", "track_assisted_damage"],
    ]
      .map((f, i) => (i === 0 ? f : `statistics.random.${f}`))
      .join(","),
  })

  const gone = ids.filter((id) => !info[String(id)])
  if (gone.length) {
    await pool.query(`DELETE FROM crawl_accounts WHERE region = $1 AND account_id = ANY($2::bigint[])`, [region, gone])
  }

  const alive = queued.filter((q) => info[q.account_id])
  const changed = alive.filter((q) => q.battles !== info[q.account_id]!.statistics.random.battles)

  // One account/tanks call covers up to 100 players, replacing a tanks/stats call per player.
  const [tankData, clans] = await Promise.all([
    changed.length
      ? wg<AccountTanks>(region, "account/tanks", {
          account_id: changed.map((q) => q.account_id).join(","),
          fields: "tank_id,statistics.battles",
        }).catch(() => null)
      : null,
    changed.length
      ? wg<Record<string, { clan: { tag: string } | null } | null>>(region, "clans/accountinfo", {
          account_id: changed.map((q) => q.account_id).join(","),
          extra: "clan",
          fields: "clan.tag",
        }).catch(() => null)
      : null,
  ])

  const history = new Map<string, AggSnapshot[]>()
  if (alive.length) {
    const { rows } = await pool.query<{ account_id: string; day: string; captured_at: Date; agg: number[] }>(
      `SELECT account_id, to_char(day, 'YYYY-MM-DD') AS day, captured_at, agg FROM account_snapshots
       WHERE region = $1 AND account_id = ANY($2::bigint[]) ORDER BY day`,
      [region, alive.map((q) => q.account_id)],
    )
    for (const r of rows) {
      const list = history.get(r.account_id) ?? []
      list.push({ day: r.day, capturedAt: r.captured_at, agg: r.agg })
      history.set(r.account_id, list)
    }
  }

  const now = Date.now()
  const today = utcDay(now)

  for (const q of alive) {
    const acc = info[q.account_id]!
    const snaps = history.get(q.account_id) ?? []
    const isChanged = changed.includes(q)
    const tanks = tankData?.[q.account_id]
    const fresh = tanks
      ? buildFastAgg(
          totalsOf(acc),
          tanks.map((t) => [t.tank_id, t.statistics.battles]),
          wn8Exp,
          wnxExpected,
        )
      : null
    const current = fresh ?? snaps.at(-1)?.agg
    const failed = isChanged && tankData == null
    const hidden = isChanged && tankData != null && !tanks

    await pool.query(
      `UPDATE crawl_accounts SET nickname = $3, battles = $4, last_battle_at = $5, next_check_at = $6
       WHERE region = $1 AND account_id = $2`,
      [
        region,
        q.account_id,
        acc.nickname,
        hidden || failed ? q.battles : acc.statistics.random.battles,
        new Date(acc.last_battle_time * 1000),
        new Date(now + (failed ? HOUR : hidden ? 7 * DAY : nextCheckDelay(acc.last_battle_time))),
      ],
    )
    stats.checked++
    if (!current) continue

    if (fresh) {
      stats.changed++
      await pool.query(
        `INSERT INTO account_snapshots (region, account_id, day, captured_at, agg) VALUES ($1, $2, $3, now(), $4)
         ON CONFLICT (region, account_id, day) DO UPDATE SET captured_at = now(), agg = EXCLUDED.agg`,
        [region, q.account_id, today, fresh],
      )
    }

    // Previous snapshots only: today's row (if any) is the current state, not a baseline.
    const baselines = snaps.filter((s) => s.day < today || !fresh)
    const periods = Object.fromEntries(
      PERIODS.map((p) => {
        const { baseline, partial } = pickAggBaseline(p.key, p.ms, baselines, now)
        return [p.key, periodFromAgg(p.key, current, baseline, partial)]
      }),
    )
    const overall = aggRatings(current)
    const battles = Math.round(current[A.battles])
    const clanTag = clans?.[q.account_id]?.clan?.tag

    await pool.query(
      `INSERT INTO players (region, account_id, nickname, clan_tag, battles, win_rate, avg_damage, wn8, wnx, wg,
         week_battles, week_win_rate, week_avg_damage, week_wn8, week_wnx,
         month_battles, month_win_rate, month_avg_damage, month_wn8, month_wnx, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20, now())
       ON CONFLICT (region, account_id) DO UPDATE SET
         nickname = EXCLUDED.nickname,
         clan_tag = CASE WHEN $21 THEN EXCLUDED.clan_tag ELSE players.clan_tag END,
         battles = EXCLUDED.battles, win_rate = EXCLUDED.win_rate, avg_damage = EXCLUDED.avg_damage,
         wn8 = EXCLUDED.wn8, wnx = EXCLUDED.wnx, wg = EXCLUDED.wg,
         week_battles = EXCLUDED.week_battles, week_win_rate = EXCLUDED.week_win_rate,
         week_avg_damage = EXCLUDED.week_avg_damage, week_wn8 = EXCLUDED.week_wn8, week_wnx = EXCLUDED.week_wnx,
         month_battles = EXCLUDED.month_battles, month_win_rate = EXCLUDED.month_win_rate,
         month_avg_damage = EXCLUDED.month_avg_damage, month_wn8 = EXCLUDED.month_wn8, month_wnx = EXCLUDED.month_wnx,
         updated_at = now()`,
      [
        region,
        q.account_id,
        acc.nickname,
        clanTag ?? null,
        battles,
        battles ? (current[A.wins] / battles) * 100 : null,
        battles ? current[A.damage] / battles : null,
        overall.wn8,
        overall.wnx,
        acc.global_rating ?? null,
        periods.week.battles,
        periods.week.winRate,
        periods.week.avgDamage,
        periods.week.wn8,
        periods.week.wnx,
        periods.month.battles,
        periods.month.winRate,
        periods.month.avgDamage,
        periods.month.wn8,
        periods.month.wnx,
        clans != null && changed.includes(q),
      ],
    )
  }
  return true
}

// ---------- Retention ----------

/**
 * Keeps daily rows for the last 8 days, every 3rd day up to ~31 days, plus the single newest row
 * older than that (the monthly baseline). A player's latest row is never deleted.
 */
async function pruneSnapshots() {
  const { rows } = await pool.query<{ due: boolean }>(
    `SELECT coalesce((SELECT updated_at < now() - interval '20 hours' FROM crawl_state WHERE key = 'prune'), true) AS due`,
  )
  if (!rows[0].due) return
  await pool.query(
    `INSERT INTO crawl_state (key, cursor) VALUES ('prune', 0)
     ON CONFLICT (key) DO UPDATE SET updated_at = now()`,
  )
  const res = await pool.query(
    `DELETE FROM account_snapshots s
     WHERE s.day < current_date - 8
       AND EXISTS (
         SELECT 1 FROM account_snapshots n
         WHERE n.region = s.region AND n.account_id = s.account_id AND n.day > s.day
           AND ((s.day - date '2000-01-01') % 3 <> 0 OR n.day <= current_date - 31)
       )`,
  )
  console.log(`[crawler] pruned ${res.rowCount ?? 0} old snapshots`)
}

// ---------- Main loop ----------

async function worker(id: number, wn8Exp: Wn8ExpMap) {
  let turn = id
  while (timeLeft() > 30_000) {
    const region = REGION_LIST[turn++ % REGION_LIST.length]
    try {
      const updated = await updateBatch(region, wn8Exp)
      if (!updated) await discoverBatch(region)
    } catch (error) {
      stats.errors++
      console.error(`[crawler] worker ${id} ${region}:`, error instanceof Error ? error.message : error)
      await sleep(3000)
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URL || !process.env.WARGAMING_APPLICATION_ID) {
    throw new Error("DATABASE_URL and WARGAMING_APPLICATION_ID must be set")
  }
  if (!REGION_LIST.length) throw new Error("CRAWL_REGIONS contains no valid region")

  const wn8Exp = await getWn8Expected()
  console.log(`[crawler] regions=${REGION_LIST.join(",")} rps=${RPS} workers=${WORKERS} wn8exp=${wn8Exp.size}`)
  await pruneSnapshots()
  await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i, wn8Exp)))

  const { rows } = await pool.query<{ region: string; total: string; due: string }>(
    `SELECT region, count(*) AS total, count(*) FILTER (WHERE next_check_at <= now()) AS due
     FROM crawl_accounts GROUP BY region`,
  )
  console.log("[crawler] run stats", stats)
  console.table(rows)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
