import type { Metadata } from "next"
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import { getLeaderboard, MIN_BATTLES, parsePeriod, parseSort, PERIOD_OPTIONS } from "@/lib/leaderboard"
import type { Region } from "@/lib/types"

export const metadata: Metadata = {
  title: "Oyuncu Reytingleri",
  description: "Genel, son 1 ay ve son 1 hafta en iyi WN8, WNX ve galibiyet oranına sahip World of Tanks oyuncuları.",
}

type Props = {
  searchParams: Promise<{ period?: string; sort?: string; region?: string }>
}

function parseRegionFilter(v: string | undefined): Region | null {
  return v === "eu" || v === "com" || v === "asia" ? v : null
}

export default async function RatingsPage({ searchParams }: Props) {
  const sp = await searchParams
  const period = parsePeriod(sp.period)
  const sort = parseSort(sp.sort, period)
  const region = parseRegionFilter(sp.region)
  const { rows, tracked } = await getLeaderboard(period, sort, region)
  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)!.label

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Oyuncu Reytingleri</h1>
        <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
          {`TankStat'ta takip edilen ${tracked.toLocaleString("tr-TR")} oyuncu arasından en iyiler. Bir oyuncuyu aradığınızda otomatik olarak takibe alınır ve istatistikleri her gün güncellenir.`}
        </p>
      </header>

      <LeaderboardFilters period={period} sort={sort} region={region} />

      <LeaderboardTable
        rows={rows}
        sort={sort}
        caption={`${periodLabel} · en az ${MIN_BATTLES[period].toLocaleString("tr-TR")} savaş`}
      />
    </main>
  )
}
