"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RatingValue } from "@/components/rating-value"
import { formatInt, formatPercent, TANK_TYPE_LABELS, TANK_TYPE_SHORT, toRoman } from "@/lib/format"
import type { RatingKey } from "@/lib/ratings"
import type { TankRow } from "@/lib/types"
import { cn } from "@/lib/utils"

type SortKey = "name" | "tier" | "battles" | "winRate" | "avgDamage" | "wn8" | "wnx" | "mastery"

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "name", label: "Tank" },
  { key: "tier", label: "Seviye", align: "right" },
  { key: "battles", label: "Savaş", align: "right" },
  { key: "winRate", label: "Galibiyet", align: "right" },
  { key: "avgDamage", label: "Ort. Hasar", align: "right" },
  { key: "wn8", label: "WN8", align: "right" },
  { key: "wnx", label: "WNX", align: "right" },
  { key: "mastery", label: "Ustalık", align: "right" },
]

const MASTERY = ["—", "3. Sınıf", "2. Sınıf", "1. Sınıf", "As"]

const TIER_ITEMS = [
  { value: "all", label: "Tüm seviyeler" },
  ...Array.from({ length: 11 }, (_, i) => ({ value: String(11 - i), label: `Seviye ${toRoman(11 - i)}` })),
]
const TYPE_ITEMS = [
  { value: "all", label: "Tüm sınıflar" },
  ...Object.entries(TANK_TYPE_LABELS).map(([value, label]) => ({ value, label })),
]

const PAGE_SIZE = 50

export function TankTable({ tanks, rating }: { tanks: TankRow[]; rating: RatingKey }) {
  const defaultSort: SortKey = rating === "wg" ? "battles" : rating
  const [sortOverride, setSortOverride] = useState<{ key: SortKey; desc: boolean } | null>(null)
  const [query, setQuery] = useState("")
  const [tier, setTier] = useState("all")
  const [type, setType] = useState("all")
  const [minBattles, setMinBattles] = useState(() => (tanks.some((t) => t.battles >= 10) ? "10" : "0"))
  const [limit, setLimit] = useState(PAGE_SIZE)

  const sort = sortOverride ?? { key: defaultSort, desc: true }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const min = Number(minBattles) || 0
    const filtered = tanks.filter(
      (t) =>
        t.battles >= min &&
        (tier === "all" || t.tier === Number(tier)) &&
        (type === "all" || t.type === type) &&
        (!q || t.name.toLowerCase().includes(q)),
    )
    const dir = sort.desc ? -1 : 1
    return filtered.sort((a, b) => {
      if (sort.key === "name") return a.name.localeCompare(b.name, "tr") * dir
      return (((a[sort.key] as number | null) ?? -1) - ((b[sort.key] as number | null) ?? -1)) * dir
    })
  }, [tanks, query, tier, type, minBattles, sort.key, sort.desc])

  const toggleSort = (key: SortKey) => {
    setSortOverride(
      sort.key === key ? { key, desc: !sort.desc } : { key, desc: key !== "name" },
    )
  }

  return (
    <section aria-labelledby="tanklar" className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 id="tanklar" className="text-sm font-medium">
          Tanklar <span className="text-muted-foreground">({rows.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="Tank ara"
              placeholder="Tank ara…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setLimit(PAGE_SIZE)
              }}
              className="h-8 w-44 pl-8 text-sm"
            />
          </div>
          <FilterSelect label="Seviye" items={TIER_ITEMS} value={tier} onChange={setTier} />
          <FilterSelect label="Sınıf" items={TYPE_ITEMS} value={type} onChange={setType} />
          <FilterSelect
            label="Minimum savaş"
            items={[
              { value: "0", label: "Tüm savaşlar" },
              { value: "10", label: "10+ savaş" },
              { value: "50", label: "50+ savaş" },
              { value: "100", label: "100+ savaş" },
            ]}
            value={minBattles}
            onChange={setMinBattles}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((col) => {
              const active = sort.key === col.key
              const highlighted = col.key === rating
              return (
                <TableHead
                  key={col.key}
                  className={cn(col.align === "right" && "text-right", col.key === "name" && "pl-4")}
                  aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium transition-colors hover:text-foreground",
                      highlighted ? "text-primary" : active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {col.label}
                    {active &&
                      (sort.desc ? (
                        <ArrowDown className="size-3" aria-hidden="true" />
                      ) : (
                        <ArrowUp className="size-3" aria-hidden="true" />
                      ))}
                  </button>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, limit).map((t) => (
            <TableRow key={t.tankId}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  {t.icon ? (
                    <img src={t.icon} alt="" width={36} height={22} loading="lazy" className="h-[22px] w-9 object-contain" />
                  ) : (
                    <span className="h-[22px] w-9" />
                  )}
                  <span className={cn("font-medium", t.isPremium && "text-primary")}>{t.name}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {TANK_TYPE_SHORT[t.type]}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">{toRoman(t.tier)}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{formatInt(t.battles)}</TableCell>
              <TableCell className="text-right">
                <RatingValue scale="winRate" value={t.winRate}>
                  {formatPercent(t.winRate)}
                </RatingValue>
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">{formatInt(t.avgDamage)}</TableCell>
              <TableCell className={cn("text-right", rating === "wn8" && "bg-primary/5")}>
                <RatingValue scale="wn8" value={t.wn8} />
              </TableCell>
              <TableCell className={cn("text-right", rating === "wnx" && "bg-primary/5")}>
                <RatingValue scale="wnx" value={t.wnx} />
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">{MASTERY[t.mastery] ?? "—"}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={COLUMNS.length} className="py-10 text-center text-muted-foreground">
                Filtrelere uyan tank yok.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {rows.length > limit && (
        <div className="border-t border-border p-3 text-center">
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {`Daha fazla göster (${rows.length - limit} kaldı)`}
          </button>
        </div>
      )}
    </section>
  )
}

function FilterSelect({
  label,
  items,
  value,
  onChange,
}: {
  label: string
  items: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Select items={items} value={value} onValueChange={(v) => v != null && onChange(v as string)}>
      <SelectTrigger aria-label={label} size="sm" className="h-8 min-w-32 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
