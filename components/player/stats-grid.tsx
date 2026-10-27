"use client"

import { StatTile } from "@/components/stat-tile"
import { useI18n } from "@/components/i18n-provider"
import { getRatingColor } from "@/lib/ratings"
import type { PlayerSummary } from "@/lib/types"

export function StatsGrid({ summary: s }: { summary: PlayerSummary }) {
  const { t, f } = useI18n()
  const l = t.player.stats
  const items: { label: string; value: string; color?: string }[] = [
    { label: l.battles, value: f.int(s.battles) },
    { label: l.winRate, value: f.pct(s.winRate), color: getRatingColor("winRate", s.battles ? s.winRate : null) },
    { label: l.avgDamage, value: f.int(s.avgDamage) },
    { label: l.avgAssist, value: f.int(s.avgAssist) },
    { label: l.avgXp, value: f.int(s.avgXp) },
    { label: l.fragsPerBattle, value: f.dec(s.avgFrags) },
    { label: l.spotsPerBattle, value: f.dec(s.avgSpots) },
    { label: l.survival, value: f.pct(s.survival) },
    { label: l.hitRate, value: f.pct(s.hitRate) },
    { label: l.damageRatio, value: f.dec(s.damageRatio) },
    { label: l.maxDamage, value: f.int(s.maxDamage) },
    { label: l.maxFrags, value: f.int(s.maxFrags) },
  ]

  return (
    <section aria-labelledby="genel-istatistik" className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="genel-istatistik" className="text-sm font-medium">
          {t.player.general}
        </h2>
        <p className="text-xs text-muted-foreground">{t.player.wdl(f.int(s.wins), f.int(s.losses), f.int(s.draws))}</p>
      </div>
      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <StatTile key={item.label} label={item.label} value={item.value} color={item.color} />
        ))}
      </dl>
    </section>
  )
}
