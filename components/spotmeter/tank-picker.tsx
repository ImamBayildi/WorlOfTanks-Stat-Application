"use client"

import { useMemo, useState } from "react"
import { ChevronsUpDown, Plus, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useI18n } from "@/components/i18n-provider"
import type { TankListItem } from "@/lib/spotmeter/data"
import { cn } from "@/lib/utils"

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"]
export const roman = (tier: number) => ROMAN[tier] ?? String(tier)

const MAX_RESULTS = 60

export function TankPicker({
  tanks,
  value,
  onSelect,
  variant = "select",
  disabled,
  label,
}: {
  tanks: TankListItem[]
  value?: string
  onSelect: (slug: string) => void
  variant?: "select" | "add"
  disabled?: boolean
  label?: string
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const current = tanks.find((tank) => tank.slug === value)

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase()
    const list = q ? tanks.filter((tank) => tank.name.toLocaleLowerCase().includes(q)) : tanks
    return list.slice(0, MAX_RESULTS)
  }, [tanks, query])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <PopoverTrigger
        disabled={disabled}
        aria-label={label ?? t.spot.pickTank}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          variant === "select"
            ? "h-9 w-full justify-between border border-border bg-background px-3 hover:bg-muted"
            : "h-9 justify-center bg-primary px-3 text-primary-foreground hover:bg-primary/90",
        )}
      >
        {variant === "select" ? (
          <>
            <span className="truncate">{current ? current.name : t.spot.pickTank}</span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </>
        ) : (
          <>
            <Plus className="size-4" aria-hidden="true" />
            {label ?? t.spot.addTarget}
          </>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.spot.searchTank}
            aria-label={t.spot.searchTank}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul role="listbox" aria-label={t.spot.pickTank} className="max-h-72 overflow-y-auto p-1">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">{t.spot.noTank}</li>
          ) : (
            results.map((tank) => (
              <li key={tank.slug} role="option" aria-selected={tank.slug === value}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(tank.slug)
                    setOpen(false)
                    setQuery("")
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                    tank.slug === value && "bg-muted",
                  )}
                >
                  <span className="w-6 shrink-0 text-center font-mono text-xs text-muted-foreground">{roman(tank.tier)}</span>
                  <span className="flex-1 truncate">{tank.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{t.tankClasses[tank.type]}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
