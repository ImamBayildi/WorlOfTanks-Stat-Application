import Link from "next/link"
import { PERIOD_OPTIONS, SORT_OPTIONS } from "@/lib/leaderboard"
import { getI18n } from "@/lib/i18n/server"
import type { LeaderboardPeriod, LeaderboardSort, Region } from "@/lib/types"
import { cn } from "@/lib/utils"

type State = { period: LeaderboardPeriod; sort: LeaderboardSort; region: Region | null }

function href(state: State) {
  const params = new URLSearchParams()
  if (state.period !== "all") params.set("period", state.period)
  if (state.sort !== "wn8") params.set("sort", state.sort)
  if (state.region) params.set("region", state.region)
  const qs = params.toString()
  return qs ? `/reytingler?${qs}` : "/reytingler"
}

function Segment<T>({
  label,
  options,
  value,
  toHref,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  toHref: (v: T) => string
}) {
  return (
    <nav aria-label={label} className="flex rounded-lg border border-border bg-card p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <Link
            key={o.label}
            href={toHref(o.value)}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </Link>
        )
      })}
    </nav>
  )
}

export async function LeaderboardFilters(state: State) {
  const { t } = await getI18n()
  const periods = PERIOD_OPTIONS.map((p) => ({ value: p.value, label: t.leaderboard.periods[p.value] }))
  const sorts = SORT_OPTIONS.filter((s) => !s.allOnly || state.period === "all").map((s) => ({
    value: s.value,
    label: s.value === "winRate" ? t.common.winRate : s.value === "wg" ? t.ratings.wg : s.label,
  }))
  const regions: { value: Region | null; label: string }[] = [
    { value: null, label: t.common.all },
    { value: "eu", label: "EU" },
    { value: "com", label: "NA" },
    { value: "asia", label: "ASIA" },
  ]
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <Segment
        label={t.leaderboard.period}
        options={periods}
        value={state.period}
        toHref={(period) => href({ ...state, period, sort: period === "all" ? state.sort : state.sort === "wg" ? "wn8" : state.sort })}
      />
      <div className="flex flex-wrap gap-3">
        <Segment label={t.leaderboard.sort} options={sorts} value={state.sort} toHref={(sort) => href({ ...state, sort })} />
        <Segment label={t.common.region} options={regions} value={state.region} toHref={(region) => href({ ...state, region })} />
      </div>
    </div>
  )
}
