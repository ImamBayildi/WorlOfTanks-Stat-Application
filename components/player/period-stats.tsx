"use client"

import { Clock } from "lucide-react"
import { StatTile } from "@/components/stat-tile"
import { useI18n } from "@/components/i18n-provider"
import { getRatingColor } from "@/lib/ratings"
import type { PeriodStats as PeriodStatsData } from "@/lib/types"

function PeriodCard({ period: p }: { period: PeriodStatsData }) {
  const { t, f } = useI18n()
  const tp = t.player.periods
  const hasBattles = p.battles > 0
  let note: string
  if (p.since == null) note = tp.collecting
  else if (p.partial) note = tp.since(f.date(p.since))
  else note = t.player.tanks.nBattles(p.battles).replace("+", "")

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">{tp[p.key]}</h3>
        <span className="text-xs text-muted-foreground">{note}</span>
      </header>
      {hasBattles ? (
        <dl className="grid grid-cols-2 gap-2">
          <StatTile label="WN8" value={f.int(p.wn8)} color={getRatingColor("wn8", p.wn8)} />
          <StatTile label="WNX" value={f.int(p.wnx)} color={getRatingColor("wnx", p.wnx)} />
          <StatTile label={t.player.stats.winRate} value={f.pct(p.winRate)} color={getRatingColor("winRate", p.winRate)} />
          <StatTile label={t.player.stats.avgDamage} value={f.int(p.avgDamage)} />
        </dl>
      ) : (
        <div className="flex min-h-36 flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/20 px-4 text-center">
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{p.since == null ? tp.trackingNew : tp.noBattles}</p>
        </div>
      )}
    </article>
  )
}

export function PeriodStats({ periods }: { periods: PeriodStatsData[] }) {
  const { t } = useI18n()
  return (
    <section aria-labelledby="donem-istatistik" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="donem-istatistik" className="text-sm font-medium">
          {t.player.periods.title}
        </h2>
        <p className="text-xs text-muted-foreground">{t.player.periods.note}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {periods.map((p) => (
          <PeriodCard key={p.key} period={p} />
        ))}
      </div>
    </section>
  )
}
