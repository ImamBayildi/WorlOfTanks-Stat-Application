import { StatTile } from "@/components/stat-tile"
import { formatDecimal, formatInt, formatPercent } from "@/lib/format"
import { getRatingColor } from "@/lib/ratings"
import type { PlayerSummary } from "@/lib/types"

export function StatsGrid({ summary: s }: { summary: PlayerSummary }) {
  const items: { label: string; value: string; color?: string }[] = [
    { label: "Savaş", value: formatInt(s.battles) },
    { label: "Galibiyet", value: formatPercent(s.winRate), color: getRatingColor("winRate", s.battles ? s.winRate : null) },
    { label: "Ort. Hasar", value: formatInt(s.avgDamage) },
    { label: "Ort. Asist", value: formatInt(s.avgAssist) },
    { label: "Ort. Tecrübe", value: formatInt(s.avgXp) },
    { label: "İmha / Savaş", value: formatDecimal(s.avgFrags) },
    { label: "Spot / Savaş", value: formatDecimal(s.avgSpots) },
    { label: "Hayatta Kalma", value: formatPercent(s.survival) },
    { label: "İsabet Oranı", value: formatPercent(s.hitRate) },
    { label: "Hasar Oranı", value: formatDecimal(s.damageRatio) },
    { label: "Maks. Hasar", value: formatInt(s.maxDamage) },
    { label: "Maks. İmha", value: formatInt(s.maxFrags) },
  ]

  return (
    <section aria-labelledby="genel-istatistik" className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="genel-istatistik" className="text-sm font-medium">
          Genel · Rastgele savaşlar
        </h2>
        <p className="text-xs text-muted-foreground">
          {`${formatInt(s.wins)} G · ${formatInt(s.losses)} M · ${formatInt(s.draws)} B`}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <StatTile key={item.label} label={item.label} value={item.value} color={item.color} />
        ))}
      </dl>
    </section>
  )
}
