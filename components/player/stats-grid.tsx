import { RatingValue } from "@/components/rating-value"
import { formatDecimal, formatInt, formatPercent } from "@/lib/format"
import type { PlayerSummary } from "@/lib/types"

export function StatsGrid({ summary: s }: { summary: PlayerSummary }) {
  const items: { label: string; value: React.ReactNode }[] = [
    { label: "Savaş", value: formatInt(s.battles) },
    {
      label: "Galibiyet",
      value: (
        <RatingValue scale="winRate" value={s.winRate}>
          {formatPercent(s.winRate)}
        </RatingValue>
      ),
    },
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
    <section aria-labelledby="genel-istatistik" className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 id="genel-istatistik" className="text-sm font-medium">
          Rastgele savaşlar
        </h2>
        <p className="text-xs text-muted-foreground">
          {`${formatInt(s.wins)} G · ${formatInt(s.losses)} M · ${formatInt(s.draws)} B`}
        </p>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="border-border px-5 py-4 [&:not(:last-child)]:border-b lg:[&:nth-last-child(-n+6)]:border-b-0">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 font-mono text-lg font-semibold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
