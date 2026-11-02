import type { RatingKey } from "@/lib/ratings"

export type Region = "eu" | "com" | "asia"

export type TankType = "lightTank" | "mediumTank" | "heavyTank" | "AT-SPG" | "SPG"

export type Ratings = Record<RatingKey, number | null>

export interface SearchResult {
  accountId: number
  nickname: string
  battles: number
  winRate: number | null
  wgRating: number | null
}

export interface TankRow {
  tankId: number
  name: string
  tier: number
  type: TankType
  nation: string
  isPremium: boolean
  icon: string | null
  battles: number
  winRate: number
  avgDamage: number
  avgFrags: number
  avgAssist: number
  mastery: number
  wn8: number | null
  wnx: number | null
}

export interface PlayerSummary {
  battles: number
  wins: number
  losses: number
  draws: number
  winRate: number
  avgDamage: number
  avgAssist: number
  avgXp: number
  avgFrags: number
  avgSpots: number
  survival: number
  hitRate: number
  damageRatio: number
  maxDamage: number
  maxFrags: number
  maxXp: number
}

export interface PlayerData {
  accountId: number
  region: Region
  nickname: string
  createdAt: number
  lastBattleAt: number
  clan: { tag: string; name: string; color: string } | null
  hidden: boolean
  ratings: Ratings
  summary: PlayerSummary
  tanks: TankRow[]
  periods: PeriodStats[] | null
  /** Unix seconds when a manual refresh is allowed again; null/undefined when allowed now. */
  nextRefreshAt?: number | null
}

export type PeriodKey = "day" | "week" | "month"

export interface PeriodStats {
  key: PeriodKey
  /** Unix seconds of the baseline snapshot; null while data is still being collected. */
  since: number | null
  /** True when the baseline is younger than the full period (tracking started recently). */
  partial: boolean
  battles: number
  winRate: number | null
  avgDamage: number | null
  avgFrags: number | null
  avgAssist: number | null
  wn8: number | null
  wnx: number | null
}

export type LeaderboardPeriod = "all" | "month" | "week"
export type LeaderboardSort = "wn8" | "wnx" | "wg" | "winRate"

export interface LeaderboardRow {
  region: Region
  accountId: number
  nickname: string
  clanTag: string | null
  battles: number
  winRate: number | null
  avgDamage: number | null
  wn8: number | null
  wnx: number | null
  wg: number | null
}
