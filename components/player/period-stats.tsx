import { Clock } from "lucide-react"
import { StatTile } from "@/components/stat-tile"
import { formatDate, formatInt, formatPercent } from "@/lib/format"
import { getRatingColor } from "@/lib/ratings"
import type { PeriodKey, PeriodStats as PeriodStatsData } from "@/lib/types"

const PERIOD_LABELS: Record<PeriodKey, string> = {
  day: "Son 24 saat",
  week: "Son 1 hafta",
  month: "Son 1 ay",
}

function PeriodCard({ period: p }: { period: PeriodStatsData }) {
  const hasBattles = p.battles > 0
  let note: string
  if (p.since == null) note = "Veri toplanıyor"
  else if (p.partial) note = `${formatDate(p.since)} tarihinden beri`
  else note = `${formatInt(p.battles)} savaş`

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">{PERIOD_LABELS[p.key]}</h3>
        <span className="text-xs text-muted-foreground">{note}</span>
      </header>
      {hasBattles ? (
        <dl className="grid grid-cols-2 gap-2">
          <StatTile label="WN8" value={formatInt(p.wn8)} color={getRatingColor("wn8", p.wn8)} />
          <StatTile label="WNX" value={formatInt(p.wnx)} color={getRatingColor("wnx", p.wnx)} />
          <StatTile label="Galibiyet" value={formatPercent(p.winRate)} color={getRatingColor("winRate", p.winRate)} />
          <StatTile label="Ort. Hasar" value={formatInt(p.avgDamage)} hint={`${formatInt(p.battles)} savaş`} />
        </dl>
      ) : (
        <div className="flex min-h-36 flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/20 px-4 text-center">
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {p.since == null
              ? "Takip yeni başladı. Bu dönemin verileri oyuncu sonraki savaşlarını oynadıkça görünecek."
              : "Bu dönemde rastgele savaş oynanmamış."}
          </p>
        </div>
      )}
    </article>
  )
}

export function PeriodStats({ periods }: { periods: PeriodStatsData[] }) {
  return (
    <section aria-labelledby="donem-istatistik" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="donem-istatistik" className="text-sm font-medium">
          Son dönem performansı
        </h2>
        <p className="text-xs text-muted-foreground">TankStat anlık görüntülerinden hesaplanır</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {periods.map((p) => (
          <PeriodCard key={p.key} period={p} />
        ))}
      </div>
    </section>
  )
}
