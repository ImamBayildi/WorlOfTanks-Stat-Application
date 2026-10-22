import { useMemo } from "react"
import { RatingValue } from "@/components/rating-value"
import { formatInt, formatPercent, toRoman } from "@/lib/format"
import { getRatingColor, RATING_LABELS, type RatingKey } from "@/lib/ratings"
import type { TankRow } from "@/lib/types"

export function TierBreakdown({ tanks, rating }: { tanks: TankRow[]; rating: RatingKey }) {
  const metric: "wn8" | "wnx" = rating === "wnx" ? "wnx" : "wn8"

  const tiers = useMemo(() => {
    const rows = Array.from({ length: 11 }, (_, i) => ({
      tier: i + 1,
      battles: 0,
      wins: 0,
      ratingSum: 0,
      ratingBattles: 0,
    }))
    for (const t of tanks) {
      const row = rows[t.tier - 1]
      if (!row) continue
      row.battles += t.battles
      row.wins += (t.winRate / 100) * t.battles
      const v = t[metric]
      if (v != null) {
        row.ratingSum += v * t.battles
        row.ratingBattles += t.battles
      }
    }
    return rows.filter((r) => r.battles > 0)
  }, [tanks, metric])

  const max = Math.max(...tiers.map((t) => t.battles), 1)

  return (
    <section aria-labelledby="seviye-dagilimi" className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 id="seviye-dagilimi" className="text-sm font-medium">
          Seviye dağılımı
        </h2>
        <p className="text-xs text-muted-foreground">
          Çubuk rengi: savaş ağırlıklı ort. {RATING_LABELS[metric]}
          {rating === "wg" && " (WoT Reytingi tank bazlı yayınlanmaz)"}
        </p>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {tiers.map((t) => {
          const avg = t.ratingBattles ? Math.round(t.ratingSum / t.ratingBattles) : null
          return (
            <li key={t.tier} className="grid grid-cols-[2.5rem_1fr_5rem_4.5rem] items-center gap-3 text-sm sm:grid-cols-[2.5rem_1fr_6rem_5rem_4.5rem]">
              <span className="font-mono text-muted-foreground">{toRoman(t.tier)}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(t.battles / max) * 100}%`,
                    backgroundColor: getRatingColor(metric, avg) ?? "var(--muted-foreground)",
                  }}
                />
              </span>
              <span className="text-right font-mono tabular-nums">{formatInt(t.battles)}</span>
              <span className="hidden text-right sm:block">
                <RatingValue scale="winRate" value={(t.wins / t.battles) * 100}>
                  {formatPercent((t.wins / t.battles) * 100)}
                </RatingValue>
              </span>
              <span className="text-right">
                <RatingValue scale={metric} value={avg} />
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
