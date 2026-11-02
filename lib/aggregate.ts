import type { CompactTank } from "@/lib/db/schema"
import { calcWn8, calcWnx } from "@/lib/ratings"
import type { PeriodKey, PeriodStats } from "@/lib/types"
import type { Wn8ExpMap } from "@/lib/wargaming"

/**
 * Account-level cumulative totals, stored as a fixed-length number vector so a daily snapshot
 * costs ~120 bytes regardless of how many tanks a player owns. Expected values are summed at
 * capture time, which lets WN8 / WNx for any period be computed from the difference of two vectors.
 */
export type Agg = number[]

export const A = {
  battles: 0,
  wins: 1,
  damage: 2,
  frags: 3,
  spots: 4,
  def: 5,
  assist: 6,
  w8Battles: 7,
  w8Wins: 8,
  w8Damage: 9,
  w8Frags: 10,
  w8Spots: 11,
  w8Def: 12,
  w8ExpWins: 13,
  w8ExpDamage: 14,
  w8ExpFrags: 15,
  w8ExpSpots: 16,
  w8ExpDef: 17,
  wxBattles: 18,
  wxDamage: 19,
  wxFrags: 20,
  wxSpots: 21,
  wxAssist: 22,
  wxExpDamage: 23,
  wxExpFrags: 24,
  wxExpSpots: 25,
  wxExpAssist: 26,
} as const

export const AGG_LENGTH = 27

export function buildAgg(
  tanks: CompactTank[],
  wn8Exp: Wn8ExpMap,
  wnxExp: Record<string, [number, number, number, number]>,
): Agg {
  const v: Agg = new Array(AGG_LENGTH).fill(0)
  for (const [tankId, battles, wins, damage, frags, spots, def, assist] of tanks) {
    if (battles <= 0) continue
    v[A.battles] += battles
    v[A.wins] += wins
    v[A.damage] += damage
    v[A.frags] += frags
    v[A.spots] += spots
    v[A.def] += def
    v[A.assist] += assist

    const e8 = wn8Exp.get(tankId)
    if (e8) {
      v[A.w8Battles] += battles
      v[A.w8Wins] += wins
      v[A.w8Damage] += damage
      v[A.w8Frags] += frags
      v[A.w8Spots] += spots
      v[A.w8Def] += def
      v[A.w8ExpWins] += (e8.winRate / 100) * battles
      v[A.w8ExpDamage] += e8.damage * battles
      v[A.w8ExpFrags] += e8.frags * battles
      v[A.w8ExpSpots] += e8.spots * battles
      v[A.w8ExpDef] += e8.def * battles
    }

    const ex = wnxExp[String(tankId)]
    if (ex) {
      v[A.wxBattles] += battles
      v[A.wxDamage] += damage
      v[A.wxFrags] += frags
      v[A.wxSpots] += spots
      v[A.wxAssist] += assist
      v[A.wxExpDamage] += ex[0] * battles
      v[A.wxExpFrags] += ex[1] * battles
      v[A.wxExpSpots] += ex[2] * battles
      v[A.wxExpAssist] += ex[3] * battles
    }
  }
  return v
}

export function aggRatings(v: Agg) {
  const wn8 =
    v[A.w8Battles] > 0
      ? calcWn8(
          {
            battles: v[A.w8Battles],
            wins: v[A.w8Wins],
            damage: v[A.w8Damage],
            frags: v[A.w8Frags],
            spots: v[A.w8Spots],
            def: v[A.w8Def],
            assist: 0,
          },
          {
            wins: v[A.w8ExpWins],
            damage: v[A.w8ExpDamage],
            frags: v[A.w8ExpFrags],
            spots: v[A.w8ExpSpots],
            def: v[A.w8ExpDef],
          },
        )
      : null
  const wnx =
    v[A.wxBattles] > 0
      ? calcWnx(
          {
            battles: v[A.wxBattles],
            wins: 0,
            damage: v[A.wxDamage],
            frags: v[A.wxFrags],
            spots: v[A.wxSpots],
            def: 0,
            assist: v[A.wxAssist],
          },
          {
            damage: v[A.wxExpDamage],
            frags: v[A.wxExpFrags],
            spots: v[A.wxExpSpots],
            assist: v[A.wxExpAssist],
          },
        )
      : null
  return { wn8, wnx }
}

export interface AggSnapshot {
  day: string
  capturedAt: Date
  agg: Agg
}

export function utcDay(ms: number) {
  return new Date(ms).toISOString().slice(0, 10)
}

function emptyPeriod(key: PeriodKey, since: number | null, partial: boolean): PeriodStats {
  return {
    key,
    since,
    partial,
    battles: 0,
    winRate: null,
    avgDamage: null,
    avgFrags: null,
    avgAssist: null,
    wn8: null,
    wnx: null,
  }
}

/** Picks the baseline snapshot for a period. History must be sorted oldest → newest. */
export function pickAggBaseline(key: PeriodKey, ms: number, history: AggSnapshot[], now: number) {
  const today = utcDay(now)
  const cutoff = now - ms
  let baseline: AggSnapshot | undefined
  for (const snap of history) {
    // "Day" means since the last check of a previous UTC day; longer periods use a strict time cutoff.
    const eligible = key === "day" ? snap.day < today : snap.capturedAt.getTime() <= cutoff
    if (eligible) baseline = snap
  }
  if (baseline) return { baseline, partial: false }
  const oldest = history.find((s) => now - s.capturedAt.getTime() > 10 * 60 * 1000)
  return { baseline: oldest, partial: true }
}

export function periodFromAgg(
  key: PeriodKey,
  current: Agg,
  baseline: AggSnapshot | undefined,
  partial: boolean,
): PeriodStats {
  const since = baseline ? Math.floor(baseline.capturedAt.getTime() / 1000) : null
  if (!baseline) return emptyPeriod(key, null, partial)
  const d = current.map((value, i) => value - (baseline.agg[i] ?? 0))
  const battles = Math.round(d[A.battles])
  if (battles <= 0) return emptyPeriod(key, since, partial)
  const ratings = aggRatings(d)
  return {
    key,
    since,
    partial,
    battles,
    winRate: (d[A.wins] / battles) * 100,
    avgDamage: d[A.damage] / battles,
    avgFrags: d[A.frags] / battles,
    avgAssist: d[A.assist] / battles,
    wn8: ratings.wn8,
    wnx: ratings.wnx,
  }
}
