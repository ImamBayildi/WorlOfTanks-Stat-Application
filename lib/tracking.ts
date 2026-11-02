import { and, asc, eq, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { buildAgg, periodFromAgg, pickAggBaseline, utcDay, type AggSnapshot } from "@/lib/aggregate"
import { accountSnapshots, crawlAccounts, players, playerSnapshots, type CompactTank } from "@/lib/db/schema"
import type { Totals } from "@/lib/ratings"
import type { PeriodKey, PeriodStats, PlayerData, Region } from "@/lib/types"
import {
  compactToTotals,
  computeRatingsFromTotals,
  getPlayerBundle,
  getWn8Expected,
  wnxExpected,
} from "@/lib/wargaming"

const HOUR = 3600 * 1000
const DAY = 24 * HOUR

export const PERIODS: { key: PeriodKey; ms: number }[] = [
  { key: "day", ms: DAY },
  { key: "week", ms: 7 * DAY },
  { key: "month", ms: 30 * DAY },
]

const RETENTION_MS = 35 * DAY

interface Snapshot {
  capturedAt: Date
  battles: number
  tanks: CompactTank[]
}

function diffTanks(current: CompactTank[], baseline: CompactTank[]) {
  const before = new Map(baseline.map((t) => [t[0], t]))
  const entries: { tankId: number; totals: Totals }[] = []
  for (const now of current) {
    const prev = before.get(now[0])
    const battles = now[1] - (prev?.[1] ?? 0)
    if (battles <= 0) continue
    const a = compactToTotals(now)
    const b = prev ? compactToTotals(prev) : null
    entries.push({
      tankId: now[0],
      totals: {
        battles,
        wins: a.wins - (b?.wins ?? 0),
        damage: a.damage - (b?.damage ?? 0),
        frags: a.frags - (b?.frags ?? 0),
        spots: a.spots - (b?.spots ?? 0),
        def: a.def - (b?.def ?? 0),
        assist: a.assist - (b?.assist ?? 0),
      },
    })
  }
  return entries
}

async function buildPeriod(
  key: PeriodKey,
  ms: number,
  current: CompactTank[],
  history: Snapshot[],
  now: number,
): Promise<PeriodStats> {
  const cutoff = now - ms
  // Latest snapshot at or before the cutoff; otherwise the oldest one we have (partial period).
  let baseline: Snapshot | undefined
  for (const snap of history) {
    if (snap.capturedAt.getTime() <= cutoff) baseline = snap
  }
  const partial = !baseline
  baseline ??= history.find((s) => now - s.capturedAt.getTime() > 10 * 60 * 1000)

  const empty: PeriodStats = {
    key,
    since: baseline ? Math.floor(baseline.capturedAt.getTime() / 1000) : null,
    partial,
    battles: 0,
    winRate: null,
    avgDamage: null,
    avgFrags: null,
    avgAssist: null,
    wn8: null,
    wnx: null,
  }
  if (!baseline) return empty

  const entries = diffTanks(current, baseline.tanks)
  const sum = entries.reduce(
    (acc, e) => {
      acc.battles += e.totals.battles
      acc.wins += e.totals.wins
      acc.damage += e.totals.damage
      acc.frags += e.totals.frags
      acc.assist += e.totals.assist
      return acc
    },
    { battles: 0, wins: 0, damage: 0, frags: 0, assist: 0 },
  )
  if (!sum.battles) return empty

  const ratings = await computeRatingsFromTotals(entries)
  return {
    ...empty,
    battles: sum.battles,
    winRate: (sum.wins / sum.battles) * 100,
    avgDamage: sum.damage / sum.battles,
    avgFrags: sum.frags / sum.battles,
    avgAssist: sum.assist / sum.battles,
    wn8: ratings.wn8,
    wnx: ratings.wnx,
  }
}

function shouldSnapshot(latest: Snapshot | undefined, battles: number, now: number) {
  if (!latest) return true
  const age = now - latest.capturedAt.getTime()
  if (latest.battles !== battles && age > 15 * 60 * 1000) return true
  return age > 20 * HOUR
}

/** Stores a snapshot when needed, computes 24h / 7d / 30d stats and refreshes the leaderboard row. */
async function trackPlayer(region: Region, player: PlayerData, compact: CompactTank[]): Promise<PeriodStats[]> {
  const now = Date.now()
  const where = and(eq(playerSnapshots.region, region), eq(playerSnapshots.accountId, player.accountId))

  const history: Snapshot[] = await db
    .select({ capturedAt: playerSnapshots.capturedAt, battles: playerSnapshots.battles, tanks: playerSnapshots.tanks })
    .from(playerSnapshots)
    .where(where)
    .orderBy(asc(playerSnapshots.capturedAt))

  const [wn8Exp, aggRows] = await Promise.all([
    getWn8Expected(),
    db
      .select({ day: accountSnapshots.day, capturedAt: accountSnapshots.capturedAt, agg: accountSnapshots.agg })
      .from(accountSnapshots)
      .where(and(eq(accountSnapshots.region, region), eq(accountSnapshots.accountId, player.accountId)))
      .orderBy(asc(accountSnapshots.day)),
  ])
  const today = utcDay(now)
  const currentAgg = buildAgg(compact, wn8Exp, wnxExpected)
  const aggHistory: AggSnapshot[] = aggRows.filter((r) => r.day < today)

  const periods = await Promise.all(
    PERIODS.map(async (p) => {
      const exact = await buildPeriod(p.key, p.ms, compact, history, now)
      if (!exact.partial) return exact
      // Fall back to the crawler's daily snapshots when they reach further back than per-tank history.
      const { baseline, partial } = pickAggBaseline(p.key, p.ms, aggHistory, now)
      if (baseline && (exact.since == null || baseline.capturedAt.getTime() / 1000 < exact.since)) {
        return periodFromAgg(p.key, currentAgg, baseline, partial)
      }
      return exact
    }),
  )

  const writes: Promise<unknown>[] = [
    db
      .insert(accountSnapshots)
      .values({ region, accountId: player.accountId, day: today, agg: currentAgg })
      .onConflictDoUpdate({
        target: [accountSnapshots.region, accountSnapshots.accountId, accountSnapshots.day],
        set: { agg: currentAgg, capturedAt: new Date(now) },
      }),
    db
      .insert(crawlAccounts)
      .values({
        region,
        accountId: player.accountId,
        nickname: player.nickname,
        battles: player.summary.battles,
        lastBattleAt: new Date(player.lastBattleAt * 1000),
        nextCheckAt: new Date(now + 10 * HOUR),
      })
      .onConflictDoNothing(),
  ]
  if (shouldSnapshot(history.at(-1), player.summary.battles, now)) {
    writes.push(
      db.insert(playerSnapshots).values({
        region,
        accountId: player.accountId,
        battles: player.summary.battles,
        tanks: compact,
      }),
    )
  }
  if (history.length && now - history[0].capturedAt.getTime() > RETENTION_MS) {
    writes.push(db.delete(playerSnapshots).where(and(where, lt(playerSnapshots.capturedAt, new Date(now - RETENTION_MS)))))
  }

  const week = periods.find((p) => p.key === "week")!
  const month = periods.find((p) => p.key === "month")!
  const row = {
    nickname: player.nickname,
    clanTag: player.clan?.tag ?? null,
    battles: player.summary.battles,
    winRate: player.summary.battles ? player.summary.winRate : null,
    avgDamage: player.summary.battles ? player.summary.avgDamage : null,
    wn8: player.ratings.wn8,
    wnx: player.ratings.wnx,
    wg: player.ratings.wg,
    weekBattles: week.battles,
    weekWinRate: week.winRate,
    weekAvgDamage: week.avgDamage,
    weekWn8: week.wn8,
    weekWnx: week.wnx,
    monthBattles: month.battles,
    monthWinRate: month.winRate,
    monthAvgDamage: month.avgDamage,
    monthWn8: month.wn8,
    monthWnx: month.wnx,
    updatedAt: new Date(now),
  }
  writes.push(
    db
      .insert(players)
      .values({ region, accountId: player.accountId, ...row })
      .onConflictDoUpdate({ target: [players.region, players.accountId], set: row }),
  )

  await Promise.all(writes)
  return periods
}

export async function getTrackedPlayer(region: Region, accountId: number): Promise<PlayerData | null> {
  const bundle = await getPlayerBundle(region, accountId)
  if (!bundle) return null
  const { player, compact } = bundle
  if (!compact) return player

  try {
    return { ...player, periods: await trackPlayer(region, player, compact) }
  } catch (error) {
    console.error("[tracking] failed to compute period stats", error)
    return player
  }
}

/** Refreshes the least recently updated tracked players (used by the daily cron). */
export async function refreshStalePlayers(limit = 25) {
  const stale = await db
    .select({ region: players.region, accountId: players.accountId })
    .from(players)
    .where(lt(players.updatedAt, sql`now() - interval '12 hours'`))
    .orderBy(asc(players.updatedAt))
    .limit(limit)

  let refreshed = 0
  for (const p of stale) {
    const result = await getTrackedPlayer(p.region as Region, p.accountId).catch(() => null)
    if (result) refreshed++
  }
  return { checked: stale.length, refreshed }
}
