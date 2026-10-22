"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { RatingToggle } from "@/components/rating-toggle"
import { RatingValue } from "@/components/rating-value"
import { formatDate, formatInt, formatPercent } from "@/lib/format"
import { getScaleStep, RATING_LABELS, type RatingKey } from "@/lib/ratings"
import type { Region, SearchResult } from "@/lib/types"

export function SearchResults({
  results,
  region,
  query,
  initialRating,
}: {
  results: SearchResult[]
  region: Region
  query: string
  initialRating: RatingKey
}) {
  const [rating, setRating] = useState(initialRating)

  const sorted = useMemo(
    () => [...results].sort((a, b) => (b.ratings[rating] ?? -1) - (a.ratings[rating] ?? -1)),
    [results, rating],
  )

  const changeRating = (next: RatingKey) => {
    setRating(next)
    const url = new URL(window.location.href)
    url.searchParams.set("rating", next)
    window.history.replaceState(null, "", url)
  }

  if (!results.length) {
    return (
      <p className="text-muted-foreground">
        {`"${query}" ile başlayan bir oyuncu bulunamadı. Sunucuyu kontrol edin.`}
      </p>
    )
  }

  return (
    <section aria-labelledby="sonuclar">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 id="sonuclar" className="text-xl font-semibold tracking-tight">
            {`"${query}" için ${results.length} oyuncu`}
          </h1>
          <p className="text-sm text-muted-foreground">{RATING_LABELS[rating]} değerine göre sıralandı</p>
        </div>
        <RatingToggle value={rating} onChange={changeRating} />
      </div>

      <ol className="mt-5 flex flex-col gap-2">
        {sorted.map((p, i) => {
          const step = getScaleStep(rating, p.ratings[rating])
          return (
            <li key={p.accountId}>
              <Link
                href={`/player/${region}/${p.accountId}?rating=${rating}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <span className="w-6 text-center font-mono text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                <span
                  className="h-10 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: step?.color ?? "var(--muted)" }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.nickname}</p>
                  <p className="text-xs text-muted-foreground">Son savaş: {formatDate(p.lastBattleAt)}</p>
                </div>
                <dl className="hidden items-center gap-8 text-right text-sm md:flex">
                  <div>
                    <dt className="text-xs text-muted-foreground">Savaş</dt>
                    <dd className="font-mono tabular-nums">{formatInt(p.battles)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Galibiyet</dt>
                    <dd>
                      <RatingValue scale="winRate" value={p.winRate}>
                        {formatPercent(p.winRate)}
                      </RatingValue>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Ort. Hasar</dt>
                    <dd className="font-mono tabular-nums">{formatInt(p.avgDamage)}</dd>
                  </div>
                </dl>
                <div className="w-24 text-right">
                  <p className="text-xs text-muted-foreground">{RATING_LABELS[rating]}</p>
                  <RatingValue scale={rating} value={p.ratings[rating]} className="text-lg" />
                </div>
                <ChevronRight
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
