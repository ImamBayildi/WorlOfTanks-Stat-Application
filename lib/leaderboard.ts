import { and, desc, eq, gte, isNotNull, type SQL } from "drizzle-orm"
import type { PgColumn } from "drizzle-orm/pg-core"
import { db } from "@/lib/db"
import { players } from "@/lib/db/schema"
import type { LeaderboardPeriod, LeaderboardRow, LeaderboardSort, Region } from "@/lib/types"

export const MIN_BATTLES: Record<LeaderboardPeriod, number> = { all: 1000, month: 50, week: 15 }

export const PERIOD_OPTIONS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "all", label: "Genel" },
  { value: "month", label: "Son 1 ay" },
  { value: "week", label: "Son 1 hafta" },
]

export const SORT_OPTIONS: { value: LeaderboardSort; label: string; allOnly?: boolean }[] = [
  { value: "wn8", label: "WN8" },
  { value: "wnx", label: "WNX" },
  { value: "winRate", label: "Galibiyet" },
  { value: "wg", label: "WoT Reytingi", allOnly: true },
]

export function parsePeriod(v: string | undefined): LeaderboardPeriod {
  return v === "month" || v === "week" ? v : "all"
}

export function parseSort(v: string | undefined, period: LeaderboardPeriod): LeaderboardSort {
  if (v === "wnx" || v === "winRate") return v
  if (v === "wg" && period === "all") return v
  return "wn8"
}

const COLUMNS = {
  all: {
    battles: players.battles,
    winRate: players.winRate,
    avgDamage: players.avgDamage,
    wn8: players.wn8,
    wnx: players.wnx,
    wg: players.wg,
  },
  month: {
    battles: players.monthBattles,
    winRate: players.monthWinRate,
    avgDamage: players.monthAvgDamage,
    wn8: players.monthWn8,
    wnx: players.monthWnx,
    wg: players.wg,
  },
  week: {
    battles: players.weekBattles,
    winRate: players.weekWinRate,
    avgDamage: players.weekAvgDamage,
    wn8: players.weekWn8,
    wnx: players.weekWnx,
    wg: players.wg,
  },
} satisfies Record<LeaderboardPeriod, Record<string, PgColumn>>

export async function getLeaderboard(
  period: LeaderboardPeriod,
  sort: LeaderboardSort,
  region: Region | null,
  limit = 100,
): Promise<{ rows: LeaderboardRow[]; tracked: number }> {
  const c = COLUMNS[period]
  const sortColumn = c[sort]
  const filters: SQL[] = [gte(c.battles, MIN_BATTLES[period]), isNotNull(sortColumn)]
  if (region) filters.push(eq(players.region, region))

  const [rows, tracked] = await Promise.all([
    db
      .select({
        region: players.region,
        accountId: players.accountId,
        nickname: players.nickname,
        clanTag: players.clanTag,
        battles: c.battles,
        winRate: c.winRate,
        avgDamage: c.avgDamage,
        wn8: c.wn8,
        wnx: c.wnx,
        wg: c.wg,
      })
      .from(players)
      .where(and(...filters))
      .orderBy(desc(sortColumn), desc(c.battles))
      .limit(limit),
    db.$count(players, region ? eq(players.region, region) : undefined),
  ])

  return { rows: rows.map((r) => ({ ...r, region: r.region as Region })), tracked }
}
