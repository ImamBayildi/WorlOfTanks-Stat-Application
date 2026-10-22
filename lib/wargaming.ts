import { cache } from "react"
import wnxExpectedRaw from "@/lib/data/wnx-expected.json"
import { calcWn8, calcWnx, type Totals } from "@/lib/ratings"
import type { PlayerData, Region, SearchResult, TankRow, TankType } from "@/lib/types"

export const REGIONS: Record<Region, { host: string; label: string }> = {
  eu: { host: "api.worldoftanks.eu", label: "EU" },
  com: { host: "api.worldoftanks.com", label: "NA" },
  asia: { host: "api.worldoftanks.asia", label: "ASIA" },
}

export function parseRegion(value: string | undefined | null): Region {
  return value === "com" || value === "asia" ? value : "eu"
}

export class WargamingError extends Error {}

async function wgFetch<T>(
  region: Region,
  path: string,
  params: Record<string, string>,
  revalidate: number,
): Promise<T> {
  const appId = process.env.WARGAMING_APPLICATION_ID
  if (!appId) throw new WargamingError("WARGAMING_APPLICATION_ID ortam değişkeni tanımlı değil.")

  const url = new URL(`https://${REGIONS[region].host}/wot/${path}/`)
  url.searchParams.set("application_id", appId)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)

  const res = await fetch(url, { next: { revalidate } })
  if (!res.ok) throw new WargamingError(`Wargaming API hatası (${res.status}).`)
  const json = await res.json()
  if (json.status !== "ok") {
    throw new WargamingError(json.error?.message ?? "Wargaming API bilinmeyen hata.")
  }
  return json.data as T
}

interface Vehicle {
  short_name: string
  name: string
  tier: number
  type: TankType
  nation: string
  is_premium: boolean
  images: { small_icon: string | null }
}

const getVehicles = cache(async (region: Region) => {
  return wgFetch<Record<string, Vehicle>>(
    region,
    "encyclopedia/vehicles",
    { fields: "name,short_name,tier,type,nation,is_premium,images.small_icon" },
    86400,
  )
})

type Wn8ExpMap = Map<number, { damage: number; frags: number; spots: number; def: number; winRate: number }>

const getWn8Expected = cache(async (): Promise<Wn8ExpMap> => {
  const map: Wn8ExpMap = new Map()
  try {
    const res = await fetch("https://static.modxvm.com/wn8-data-exp/json/wn8exp.json", {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return map
    const json = (await res.json()) as {
      data: { IDNum: number; expDef: number; expFrag: number; expSpot: number; expDamage: number; expWinRate: number }[]
    }
    for (const t of json.data) {
      map.set(t.IDNum, {
        damage: t.expDamage,
        frags: t.expFrag,
        spots: t.expSpot,
        def: t.expDef,
        winRate: t.expWinRate,
      })
    }
  } catch {
    // WN8 is optional; the rest of the page still renders without expected values.
  }
  return map
})

const wnxExpected = wnxExpectedRaw as unknown as Record<string, [number, number, number, number]>

interface RawTankStat {
  tank_id: number
  mark_of_mastery: number
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

async function getTankStats(region: Region, accountId: number): Promise<RawTankStat[] | null> {
  const data = await wgFetch<Record<string, RawTankStat[] | null>>(
    region,
    "tanks/stats",
    {
      account_id: String(accountId),
      extra: "random",
      fields:
        "tank_id,mark_of_mastery,random.battles,random.wins,random.damage_dealt,random.frags,random.spotted,random.dropped_capture_points,random.radio_assisted_damage,random.track_assisted_damage",
    },
    600,
  )
  return data[String(accountId)] ?? null
}

function toTotals(r: RawTankStat["random"]): Totals {
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

function emptyTotals(): Totals {
  return { battles: 0, wins: 0, damage: 0, frags: 0, spots: 0, def: 0, assist: 0 }
}

function addTotals(target: Totals, source: Totals) {
  target.battles += source.battles
  target.wins += source.wins
  target.damage += source.damage
  target.frags += source.frags
  target.spots += source.spots
  target.def += source.def
  target.assist += source.assist
}

function computeRatings(stats: RawTankStat[], wn8Exp: Wn8ExpMap) {
  const wn8Actual = emptyTotals()
  const wn8Expected = { wins: 0, damage: 0, frags: 0, spots: 0, def: 0 }
  const wnxActual = emptyTotals()
  const wnxExp = { damage: 0, frags: 0, spots: 0, assist: 0 }

  const perTank = new Map<number, { wn8: number | null; wnx: number | null }>()

  for (const s of stats) {
    const totals = toTotals(s.random)
    const n = totals.battles
    if (!n) continue
    let tankWn8: number | null = null
    let tankWnx: number | null = null

    const e8 = wn8Exp.get(s.tank_id)
    if (e8) {
      const exp = {
        wins: (e8.winRate / 100) * n,
        damage: e8.damage * n,
        frags: e8.frags * n,
        spots: e8.spots * n,
        def: e8.def * n,
      }
      addTotals(wn8Actual, totals)
      wn8Expected.wins += exp.wins
      wn8Expected.damage += exp.damage
      wn8Expected.frags += exp.frags
      wn8Expected.spots += exp.spots
      wn8Expected.def += exp.def
      tankWn8 = calcWn8(totals, exp)
    }

    const ex = wnxExpected[String(s.tank_id)]
    if (ex) {
      const exp = { damage: ex[0] * n, frags: ex[1] * n, spots: ex[2] * n, assist: ex[3] * n }
      addTotals(wnxActual, totals)
      wnxExp.damage += exp.damage
      wnxExp.frags += exp.frags
      wnxExp.spots += exp.spots
      wnxExp.assist += exp.assist
      tankWnx = calcWnx(totals, exp)
    }

    perTank.set(s.tank_id, { wn8: tankWn8, wnx: tankWnx })
  }

  return {
    wn8: calcWn8(wn8Actual, wn8Expected),
    wnx: calcWnx(wnxActual, wnxExp),
    perTank,
  }
}

interface RawAccountBrief {
  nickname: string
  global_rating: number
  last_battle_time: number
  statistics: { random: { battles: number; wins: number; damage_dealt: number } }
}

export async function searchPlayers(region: Region, query: string): Promise<SearchResult[]> {
  const list = await wgFetch<{ nickname: string; account_id: number }[]>(
    region,
    "account/list",
    { search: query, limit: "10", type: "startswith" },
    300,
  )
  if (!list.length) return []

  const ids = list.map((p) => p.account_id)
  const [info, wn8Exp, ...tankStats] = await Promise.all([
    wgFetch<Record<string, RawAccountBrief | null>>(
      region,
      "account/info",
      {
        account_id: ids.join(","),
        extra: "statistics.random",
        fields:
          "nickname,global_rating,last_battle_time,statistics.random.battles,statistics.random.wins,statistics.random.damage_dealt",
      },
      300,
    ),
    getWn8Expected(),
    ...ids.map((id) => getTankStats(region, id).catch(() => null)),
  ])

  return list.map((p, i) => {
    const acc = info[String(p.account_id)]
    const stats = tankStats[i] as RawTankStat[] | null
    const ratings = stats ? computeRatings(stats, wn8Exp) : null
    const battles = acc?.statistics.random.battles ?? 0
    return {
      accountId: p.account_id,
      nickname: p.nickname,
      battles,
      winRate: battles ? (acc!.statistics.random.wins / battles) * 100 : null,
      avgDamage: battles ? acc!.statistics.random.damage_dealt / battles : null,
      lastBattleAt: acc?.last_battle_time ?? null,
      ratings: {
        wn8: ratings?.wn8 ?? null,
        wnx: ratings?.wnx ?? null,
        wg: acc?.global_rating ?? null,
      },
    }
  })
}

interface RawAccountFull {
  nickname: string
  global_rating: number
  created_at: number
  last_battle_time: number
  clan_id: number | null
  statistics: {
    random: {
      battles: number
      wins: number
      losses: number
      draws: number
      damage_dealt: number
      damage_received: number
      frags: number
      spotted: number
      xp: number
      survived_battles: number
      hits_percents: number
      radio_assisted_damage: number
      track_assisted_damage: number
      dropped_capture_points: number
      capture_points: number
    }
    all: { max_damage: number; max_frags: number; max_xp: number }
  }
}

export const getPlayer = cache(async (region: Region, accountId: number): Promise<PlayerData | null> => {
  const [info, stats, vehicles, wn8Exp, clan] = await Promise.all([
    wgFetch<Record<string, RawAccountFull | null>>(
      region,
      "account/info",
      {
        account_id: String(accountId),
        extra: "statistics.random",
        fields:
          "nickname,global_rating,created_at,last_battle_time,clan_id,statistics.random,statistics.all.max_damage,statistics.all.max_frags,statistics.all.max_xp",
      },
      600,
    ),
    getTankStats(region, accountId),
    getVehicles(region),
    getWn8Expected(),
    wgFetch<Record<string, { clan: { tag: string; name: string; color: string } | null } | null>>(
      region,
      "clans/accountinfo",
      { account_id: String(accountId), extra: "clan", fields: "clan.tag,clan.name,clan.color" },
      3600,
    ).catch(() => null),
  ])

  const acc = info[String(accountId)]
  if (!acc) return null

  const r = acc.statistics.random
  const b = r.battles || 0
  const ratings = stats ? computeRatings(stats, wn8Exp) : null

  const tanks: TankRow[] = (stats ?? [])
    .filter((s) => s.random.battles > 0)
    .map((s) => {
      const v = vehicles[String(s.tank_id)]
      const n = s.random.battles
      const tankRatings = ratings?.perTank.get(s.tank_id)
      return {
        tankId: s.tank_id,
        name: v?.short_name ?? v?.name ?? `Tank #${s.tank_id}`,
        tier: v?.tier ?? 0,
        type: v?.type ?? "mediumTank",
        nation: v?.nation ?? "unknown",
        isPremium: v?.is_premium ?? false,
        icon: v?.images.small_icon?.replace(/^http:/, "https:") ?? null,
        battles: n,
        winRate: (s.random.wins / n) * 100,
        avgDamage: s.random.damage_dealt / n,
        avgFrags: s.random.frags / n,
        avgAssist: (s.random.radio_assisted_damage + s.random.track_assisted_damage) / n,
        mastery: s.mark_of_mastery,
        wn8: tankRatings?.wn8 ?? null,
        wnx: tankRatings?.wnx ?? null,
      }
    })

  const clanInfo = clan?.[String(accountId)]?.clan ?? null

  return {
    accountId,
    region,
    nickname: acc.nickname,
    createdAt: acc.created_at,
    lastBattleAt: acc.last_battle_time,
    clan: clanInfo ? { tag: clanInfo.tag, name: clanInfo.name, color: clanInfo.color } : null,
    hidden: stats == null,
    ratings: {
      wn8: ratings?.wn8 ?? null,
      wnx: ratings?.wnx ?? null,
      wg: acc.global_rating ?? null,
    },
    summary: {
      battles: b,
      wins: r.wins,
      losses: r.losses,
      draws: r.draws,
      winRate: b ? (r.wins / b) * 100 : 0,
      avgDamage: b ? r.damage_dealt / b : 0,
      avgAssist: b ? (r.radio_assisted_damage + r.track_assisted_damage) / b : 0,
      avgXp: b ? r.xp / b : 0,
      avgFrags: b ? r.frags / b : 0,
      avgSpots: b ? r.spotted / b : 0,
      survival: b ? (r.survived_battles / b) * 100 : 0,
      hitRate: r.hits_percents ?? 0,
      damageRatio: r.damage_received ? r.damage_dealt / r.damage_received : 0,
      maxDamage: acc.statistics.all.max_damage ?? 0,
      maxFrags: acc.statistics.all.max_frags ?? 0,
      maxXp: acc.statistics.all.max_xp ?? 0,
    },
    tanks,
  }
})
