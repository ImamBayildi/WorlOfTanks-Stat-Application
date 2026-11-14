"use client"

import { Fragment, useState } from "react"
import { CalendarDays, CalendarRange, ChevronDown, Clock3, Swords } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"
import { RatingValue } from "@/components/rating-value"
import { TankTypeIcon } from "@/components/tank-type-icon"
import { toRoman } from "@/lib/format"
import { getRatingColor, getScaleStep, type SCALES } from "@/lib/ratings"
import { cn } from "@/lib/utils"
import type { PeriodKey, PeriodStats as PeriodStatsData, TankRow } from "@/lib/types"

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

function TankBreakdown({ period, tankById }: { period: PeriodStatsData; tankById: Map<number, TankRow> }) {
  const { t, f } = useI18n()
  const rows = period.tanks ?? []
  const hasMissingWn8 = rows.some((row) => row.wn8 == null)

  if (!rows.length) {
    return <p className="px-4 py-5 text-center text-sm text-muted-foreground">{t.player.periods.tankDetailsUnavailable}</p>
  }

  return (
    <div className="bg-background/45 p-3 sm:p-4">
      <div className="mb-2 grid grid-cols-[minmax(5.5rem,1fr)_2.25rem_3.5rem_4.25rem_3rem] gap-1 px-1 text-[8px] font-extrabold uppercase tracking-[0.05em] text-muted-foreground sm:grid-cols-[minmax(9rem,1fr)_4.5rem_5.5rem_6rem_5rem] sm:gap-2 sm:px-2 sm:text-[10px] sm:tracking-[0.09em]">
        <span>{t.common.tank}</span>
        <span className="text-right">{t.player.stats.battles}</span>
        <span className="text-right">{t.player.stats.avgDamage}</span>
        <span className="text-right">{t.player.stats.winRate}</span>
        <span className="text-right">WN8</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card/70">
        {rows.map((row) => {
          const tank = tankById.get(row.tankId)
          return (
            <div
              key={row.tankId}
              className="grid grid-cols-[minmax(5.5rem,1fr)_2.25rem_3.5rem_4.25rem_3rem] items-center gap-1 border-t border-border/70 px-1.5 py-2.5 first:border-t-0 sm:grid-cols-[minmax(9rem,1fr)_4.5rem_5.5rem_6rem_5rem] sm:gap-2 sm:px-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                {tank?.icon ? (
                  <img src={tank.icon} alt="" width={40} height={24} loading="lazy" className="h-6 w-10 shrink-0 object-contain" />
                ) : (
                  <span className="h-6 w-10 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1.5">
                    {tank && (
                      <TankTypeIcon
                        type={tank.type}
                        nation={tank.nation}
                        label={t.tankTypes[tank.type] ?? tank.type}
                        className="size-4"
                      />
                    )}
                    <p className={cn("truncate text-sm font-bold", tank?.isPremium && "text-primary")}>
                      {tank?.name ?? `Tank #${row.tankId}`}
                    </p>
                  </div>
                  {tank && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{toRoman(tank.tier)}</p>
                  )}
                </div>
              </div>
              <strong className="text-right font-mono text-sm font-black tabular-nums text-sky-300">{f.int(row.battles)}</strong>
              <RatingValue scale="wn8" value={row.wn8} className="text-right text-sm font-black">
                {f.int(row.avgDamage)}
              </RatingValue>
              <RatingValue scale="winRate" value={row.winRate} className="text-right text-sm">
                {f.pct(row.winRate)}
              </RatingValue>
              {row.wn8 == null ? (
                <span className="text-right font-mono text-sm font-bold text-muted-foreground" title={t.player.periods.wn8UnavailableNote}>
                  —*
                </span>
              ) : (
                <RatingValue scale="wn8" value={row.wn8} className="text-right text-sm" />
              )}
            </div>
          )
        })}
      </div>
      {hasMissingWn8 && <p className="mt-2 px-1 text-[11px] leading-relaxed text-muted-foreground">{t.player.periods.wn8UnavailableNote}</p>}
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

function PeriodRow({
  period: p,
  tankById,
  expanded,
  onToggle,
}: {
  period: PeriodStatsData
  tankById: Map<number, TankRow>
  expanded: boolean
  onToggle: () => void
}) {
  const { t, f } = useI18n()
  const tp = t.player.periods
  const Icon = PERIOD_ICONS[p.key]

  if (p.battles <= 0) return <EmptyPeriod period={p} />

  const note = p.partial && p.since != null ? tp.since(f.date(p.since)) : null
  const tankCount = p.tanks?.length ?? 0

  return (
    <Fragment>
      <tr className="border-t border-border/80 bg-card/55 transition-colors hover:bg-secondary/35">
        <th scope="row" className="min-w-52 px-4 py-4 text-left sm:px-5">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/35 bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div>
              <span className="block text-sm font-extrabold text-foreground">{tp[p.key]}</span>
              {note && <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">{note}</span>}
              {p.tanks !== null && tankCount > 0 && (
                <button
                  type="button"
                  onClick={onToggle}
                  aria-expanded={expanded}
                  aria-controls={`period-tanks-${p.key}`}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary transition-colors hover:text-primary/80"
                >
                  {expanded ? tp.hideTanks : tp.showTanks(tankCount)}
                  <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
                </button>
              )}
              {p.tanks === null && (
                <span className="mt-2 block text-[10px] text-muted-foreground">{tp.tankDetailsUnavailable}</span>
              )}
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
      {expanded && (
        <tr id={`period-tanks-${p.key}`} className="border-t border-border/80">
          <td colSpan={6} className="p-0">
            <TankBreakdown period={p} tankById={tankById} />
          </td>
        </tr>
      )}
    </Fragment>
  )
}

function MobilePeriodCard({
  period: p,
  tankById,
  expanded,
  onToggle,
}: {
  period: PeriodStatsData
  tankById: Map<number, TankRow>
  expanded: boolean
  onToggle: () => void
}) {
  const { t, f } = useI18n()
  const tp = t.player.periods
  const Icon = PERIOD_ICONS[p.key]
  const hasBattles = p.battles > 0
  const note =
    p.since == null ? tp.collecting : p.partial ? tp.since(f.date(p.since)) : t.common.battlesN(f.int(p.battles))
  const tankCount = p.tanks?.length ?? 0

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
        <>
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
          {p.tanks !== null && tankCount > 0 && (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-controls={`mobile-period-tanks-${p.key}`}
              className="flex w-full items-center justify-center gap-1.5 border-t border-border bg-secondary/30 px-4 py-3 text-xs font-extrabold text-primary transition-colors hover:bg-secondary/55"
            >
              {expanded ? tp.hideTanks : tp.showTanks(tankCount)}
              <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
            </button>
          )}
          {p.tanks === null && (
            <p className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">{tp.tankDetailsUnavailable}</p>
          )}
          {expanded && (
            <div id={`mobile-period-tanks-${p.key}`} className="border-t border-border">
              <TankBreakdown period={p} tankById={tankById} />
            </div>
          )}
        </>
      ) : (
        <p className="m-3 rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-5 text-center text-sm text-muted-foreground">
          {p.since == null ? tp.trackingNew : tp.noBattles}
        </p>
      )}
    </article>
  )
}

export function PeriodStats({ periods, tanks }: { periods: PeriodStatsData[]; tanks: TankRow[] }) {
  const { t } = useI18n()
  const [expandedPeriods, setExpandedPeriods] = useState<Set<PeriodKey>>(() => new Set())
  const tankById = new Map(tanks.map((tank) => [tank.tankId, tank]))
  const togglePeriod = (key: PeriodKey) =>
    setExpandedPeriods((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

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
          <MobilePeriodCard
            key={p.key}
            period={p}
            tankById={tankById}
            expanded={expandedPeriods.has(p.key)}
            onToggle={() => togglePeriod(p.key)}
          />
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
                <PeriodRow
                  key={p.key}
                  period={p}
                  tankById={tankById}
                  expanded={expandedPeriods.has(p.key)}
                  onToggle={() => togglePeriod(p.key)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
