import type { Metadata } from "next"
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import { getLeaderboard, MIN_BATTLES, parsePeriod, parseSort } from "@/lib/leaderboard"
import { getI18n } from "@/lib/i18n/server"
import type { Region } from "@/lib/types"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.leaderboard.title, description: t.meta.ratingsDescription }
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
  const [{ rows, tracked }, { t, f }] = await Promise.all([getLeaderboard(period, sort, region), getI18n()])

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.leaderboard.title}</h1>
        <p className="max-w-2xl text-pretty text-sm text-muted-foreground">{t.leaderboard.intro(f.int(tracked))}</p>
      </header>

      <LeaderboardFilters period={period} sort={sort} region={region} />

      <LeaderboardTable
        rows={rows}
        sort={sort}
        caption={t.leaderboard.caption(t.leaderboard.periods[period], f.int(MIN_BATTLES[period]))}
      />
    </main>
  )
}
