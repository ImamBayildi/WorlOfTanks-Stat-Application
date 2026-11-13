"use client"

import { CalendarDays, CalendarRange, Clock3, Swords } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"
import { getRatingColor, getScaleStep, type SCALES } from "@/lib/ratings"
import { cn } from "@/lib/utils"
import type { PeriodKey, PeriodStats as PeriodStatsData } from "@/lib/types"

const PERIOD_ICONS = {
  day: Clock3,
  week: CalendarDays,
  month: CalendarRange,
} satisfies Record<PeriodKey, typeof Clock3>

function ratingCellStyle(scale: keyof typeof SCALES, value: number | null) {
  const color = getRatingColor(scale, value)
  if (!color) return undefined
  return {
    color,
    borderColor: `${color}80`,
    backgroundColor: `${color}24`,
    boxShadow: `inset 3px 0 0 ${color}`,
  }
}

function RatingCell({
  scale,
  value,
  formatted,
}: {
  scale: keyof typeof SCALES
  value: number | null
  formatted: string
}) {
  const { t } = useI18n()
  const step = getScaleStep(scale, value)

  return (
    <div
      className={cn(
        "mx-auto flex min-w-28 flex-col items-end rounded-lg border px-3 py-2 text-right",
        !step && "border-border/70 bg-secondary/30 text-muted-foreground",
      )}
      style={ratingCellStyle(scale, value)}
    >
      <strong className="font-mono text-base font-extrabold leading-none tabular-nums sm:text-lg">{formatted}</strong>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] opacity-90">
        {step ? t.ratings.skill[step.level] : "—"}
      </span>
    </div>
  )
}

function EmptyPeriod({ period: p }: { period: PeriodStatsData }) {
  const { t, f } = useI18n()
  const Icon = PERIOD_ICONS[p.key]
  const tp = t.player.periods
  const note = p.since == null ? tp.collecting : p.partial ? tp.since(f.date(p.since)) : tp.noBattles

  return (
    <tr className="border-t border-border/80 bg-card/55">
      <th scope="row" className="min-w-44 px-4 py-4 text-left sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/35 bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div>
            <span className="block text-sm font-bold text-foreground">{tp[p.key]}</span>
            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">{note}</span>
          </div>
        </div>
      </th>
      <td colSpan={5} className="px-4 py-4 text-sm text-muted-foreground sm:px-5">
        <div className="rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-3 text-center">
          {p.since == null ? tp.trackingNew : tp.noBattles}
        </div>
      </td>
    </tr>
  )
}

function PeriodRow({ period: p }: { period: PeriodStatsData }) {
  const { t, f } = useI18n()
  const tp = t.player.periods
  const Icon = PERIOD_ICONS[p.key]

  if (p.battles <= 0) return <EmptyPeriod period={p} />

  const note = p.partial && p.since != null ? tp.since(f.date(p.since)) : null

  return (
    <tr className="border-t border-border/80 bg-card/55 transition-colors hover:bg-secondary/35">
      <th scope="row" className="min-w-44 px-4 py-4 text-left sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/35 bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div>
            <span className="block text-sm font-extrabold text-foreground">{tp[p.key]}</span>
            {note && <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">{note}</span>}
          </div>
        </div>
      </th>
      <td className="px-3 py-4 text-right">
        <div className="mx-auto flex min-w-24 items-center justify-end gap-2 rounded-lg border border-sky-400/40 bg-sky-400/15 px-3 py-3 text-sky-300">
          <Swords className="size-4 shrink-0" aria-hidden="true" />
          <strong className="font-mono text-lg font-black tabular-nums">{f.int(p.battles)}</strong>
        </div>
      </td>
      <td className="px-3 py-4">
        <RatingCell scale="wn8" value={p.wn8} formatted={f.int(p.wn8)} />
      </td>
      <td className="px-3 py-4">
        <RatingCell scale="wnx" value={p.wnx} formatted={f.int(p.wnx)} />
      </td>
      <td className="px-3 py-4">
        <RatingCell scale="winRate" value={p.winRate} formatted={f.pct(p.winRate)} />
      </td>
      <td className="px-4 py-4 text-right sm:px-5">
        <div className="mx-auto min-w-28 rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-3 text-right text-amber-200">
          <strong className="font-mono text-lg font-black tabular-nums">{f.int(p.avgDamage)}</strong>
        </div>
      </td>
    </tr>
  )
}

function MobilePeriodCard({ period: p }: { period: PeriodStatsData }) {
  const { t, f } = useI18n()
  const tp = t.player.periods
  const Icon = PERIOD_ICONS[p.key]
  const hasBattles = p.battles > 0
  const note =
    p.since == null ? tp.collecting : p.partial ? tp.since(f.date(p.since)) : t.common.battlesN(f.int(p.battles))

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_40px_-28px_rgba(0,0,0,0.9)]">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-secondary/55 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/35 bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-foreground">{tp[p.key]}</h3>
            <p className="truncate text-[11px] text-muted-foreground">{note}</p>
          </div>
        </div>
        {hasBattles && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-400/15 px-2.5 py-2 text-sky-300">
            <Swords className="size-3.5" aria-hidden="true" />
            <strong className="font-mono text-base font-black tabular-nums">{f.int(p.battles)}</strong>
          </div>
        )}
      </header>

      {hasBattles ? (
        <dl className="grid grid-cols-2 gap-3 p-3">
          <div>
            <dt className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">WN8</dt>
            <dd><RatingCell scale="wn8" value={p.wn8} formatted={f.int(p.wn8)} /></dd>
          </div>
          <div>
            <dt className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">WNX</dt>
            <dd><RatingCell scale="wnx" value={p.wnx} formatted={f.int(p.wnx)} /></dd>
          </div>
          <div>
            <dt className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">{t.player.stats.winRate}</dt>
            <dd><RatingCell scale="winRate" value={p.winRate} formatted={f.pct(p.winRate)} /></dd>
          </div>
          <div>
            <dt className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">{t.player.stats.avgDamage}</dt>
            <dd className="rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-[17px] text-right text-amber-200">
              <strong className="font-mono text-lg font-black tabular-nums">{f.int(p.avgDamage)}</strong>
            </dd>
          </div>
        </dl>
      ) : (
        <p className="m-3 rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-5 text-center text-sm text-muted-foreground">
          {p.since == null ? tp.trackingNew : tp.noBattles}
        </p>
      )}
    </article>
  )
}

export function PeriodStats({ periods }: { periods: PeriodStatsData[] }) {
  const { t } = useI18n()

  return (
    <section aria-labelledby="donem-istatistik" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{t.player.periods.summary}</p>
          <h2 id="donem-istatistik" className="mt-1 text-xl font-black tracking-tight text-foreground sm:text-2xl">
            {t.player.periods.title}
          </h2>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{t.player.periods.note}</p>
      </div>

      <div className="grid gap-3 md:hidden">
        {periods.map((p) => (
          <MobilePeriodCard key={p.key} period={p} />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <caption className="sr-only">{t.player.periods.title}</caption>
            <thead>
              <tr className="bg-secondary/70 text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
                <th scope="col" className="px-4 py-3 text-left sm:px-5">{t.leaderboard.period}</th>
                <th scope="col" className="px-3 py-3 text-right">{t.player.stats.battles}</th>
                <th scope="col" className="px-3 py-3 text-right">WN8</th>
                <th scope="col" className="px-3 py-3 text-right">WNX</th>
                <th scope="col" className="px-3 py-3 text-right">{t.player.stats.winRate}</th>
                <th scope="col" className="px-4 py-3 text-right sm:px-5">{t.player.stats.avgDamage}</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <PeriodRow key={p.key} period={p} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
