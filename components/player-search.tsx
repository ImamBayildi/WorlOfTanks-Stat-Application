"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { ChevronRight, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RatingValue } from "@/components/rating-value"
import { useI18n } from "@/components/i18n-provider"
import type { Region, SearchResult } from "@/lib/types"
import { cn } from "@/lib/utils"

const REGION_ITEMS = [
  { value: "eu", label: "EU" },
  { value: "com", label: "NA" },
  { value: "asia", label: "ASIA" },
]

type SearchResponse = { results?: SearchResult[]; error?: string }

const fetcher = async (url: string): Promise<SearchResponse> => {
  const res = await fetch(url)
  const json = (await res.json()) as SearchResponse
  if (!res.ok) throw new Error(json.error ?? "")
  return json
}

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function PlayerSearch({ size = "sm", className }: { size?: "sm" | "lg"; className?: string }) {
  const router = useRouter()
  const { t, f } = useI18n()
  const listboxId = useId()
  const inputId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState("")
  const [region, setRegion] = useState<Region>("eu")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const trimmed = query.trim()
  const debounced = useDebounced(trimmed, 250)
  const key = debounced.length >= 3 ? `/api/players/search?${new URLSearchParams({ q: debounced, region })}` : null

  const { data, error, isLoading } = useSWR(key, fetcher, { keepPreviousData: true, revalidateOnFocus: false })
  const results = key ? (data?.results ?? []) : []
  const pending = trimmed.length >= 3 && (debounced !== trimmed || isLoading)
  const showPanel = open && trimmed.length > 0
  const isLarge = size === "lg"

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  const selectPlayer = (player: SearchResult) => {
    setOpen(false)
    setQuery("")
    setActiveIndex(-1)
    router.push(`/player/${region}/${player.accountId}`)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      if (results.length) setActiveIndex((i) => (i + 1) % results.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (results.length) setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (e.key === "Enter") {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      const target = results[activeIndex] ?? (results.length === 1 ? results[0] : undefined)
      if (target) selectPlayer(target)
    } else if (e.key === "Escape") {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  let status: string | null = null
  if (trimmed.length < 3) status = t.search.minChars
  else if (error) status = error.message || t.search.error
  else if (!pending && !results.length && data) status = t.search.notFound(debounced)
  else if (pending && !results.length) status = t.search.searching

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <div
        role="search"
        className={cn(
          "flex items-center gap-1 rounded-lg border border-border bg-card transition-colors focus-within:border-primary/50",
          isLarge ? "rounded-xl p-2 shadow-lg shadow-black/20" : "p-1",
        )}
      >
        <Select
          items={REGION_ITEMS}
          value={region}
          onValueChange={(v) => {
            if (!v) return
            setRegion(v as Region)
            setActiveIndex(-1)
          }}
        >
          <SelectTrigger
            aria-label="Sunucu"
            className={cn("shrink-0 border-0 bg-secondary", isLarge ? "h-11 w-24" : "h-8 w-20 text-xs")}
          >
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
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor={inputId} className="sr-only">
            Oyuncu nicki
          </label>
          <Input
            id={inputId}
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
              setActiveIndex(-1)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={t.search.placeholder}
            autoComplete="off"
            spellCheck={false}
            maxLength={24}
            className={cn(
              "border-0 bg-transparent pr-8 pl-8 shadow-none focus-visible:ring-0 dark:bg-transparent",
              isLarge ? "h-11 text-base" : "h-8 text-sm",
            )}
          />
          {pending && (
            <Loader2
              className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {showPanel && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl shadow-black/40">
          {status && (
            <p className="px-4 py-3 text-sm text-muted-foreground" aria-live="polite">
              {status}
            </p>
          )}
          <ul id={listboxId} role="listbox" aria-label={t.search.results} className={cn("max-h-96 overflow-y-auto p-1", !results.length && "hidden")}>
            {results.map((p, i) => (
              <li
                key={p.accountId}
                id={`${listboxId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectPlayer(p)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5",
                  i === activeIndex && "bg-accent",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.nickname}</p>
                  <p className="text-xs text-muted-foreground">
                    {`${f.int(p.battles)} ${t.player.stats.battles.toLocaleLowerCase()}`}
                    {p.winRate != null && (
                      <>
                        {" · "}
                        <RatingValue scale="winRate" value={p.winRate} className="font-medium">
                          {f.pct(p.winRate)}
                        </RatingValue>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{t.search.wgShort}</p>
                  <RatingValue scale="wg" value={p.wgRating} className="text-sm" />
                </div>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
