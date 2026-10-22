"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RatingToggle } from "@/components/rating-toggle"
import type { RatingKey } from "@/lib/ratings"
import type { Region } from "@/lib/types"

const REGION_ITEMS = [
  { value: "eu", label: "EU" },
  { value: "com", label: "NA" },
  { value: "asia", label: "ASIA" },
]

export function SearchForm({
  defaultQuery = "",
  defaultRegion = "eu",
  defaultRating = "wn8",
  showRating = true,
}: {
  defaultQuery?: string
  defaultRegion?: Region
  defaultRating?: RatingKey
  showRating?: boolean
}) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultQuery)
  const [region, setRegion] = useState<Region>(defaultRegion)
  const [rating, setRating] = useState<RatingKey>(defaultRating)
  const trimmed = query.trim()
  const tooShort = trimmed.length > 0 && trimmed.length < 3

  return (
    <form
      role="search"
      className="flex w-full flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (trimmed.length < 3) return
        const params = new URLSearchParams({ q: trimmed, region, rating })
        router.push(`/search?${params.toString()}`)
      }}
    >
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-2 shadow-lg shadow-black/20 sm:flex-row">
        <Select
          items={REGION_ITEMS}
          value={region}
          onValueChange={(v) => v && setRegion(v as Region)}
        >
          <SelectTrigger aria-label="Sunucu" className="h-11 w-full border-0 bg-secondary sm:w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGION_ITEMS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="nickname" className="sr-only">
            Oyuncu nicki
          </label>
          <Input
            id="nickname"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Oyuncu nicki girin…"
            autoComplete="off"
            spellCheck={false}
            className="h-11 border-0 bg-transparent pl-9 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>
        <Button type="submit" size="lg" className="h-11 px-6" disabled={trimmed.length < 3}>
          Ara
        </Button>
      </div>
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {tooShort ? "En az 3 karakter girin." : "Nick'in başını yazmanız yeterli."}
        </p>
        {showRating && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Listeleme:</span>
            <RatingToggle value={rating} onChange={setRating} />
          </div>
        )}
      </div>
    </form>
  )
}
