"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RATING_KEYS, RATING_LABELS, type RatingKey } from "@/lib/ratings"
import { cn } from "@/lib/utils"

export function RatingToggle({
  value,
  onChange,
  className,
}: {
  value: RatingKey
  onChange: (value: RatingKey) => void
  className?: string
}) {
  return (
    <ToggleGroup
      aria-label="Reyting türü"
      value={[value]}
      onValueChange={(next) => {
        const selected = next[0] as RatingKey | undefined
        if (selected) onChange(selected)
      }}
      spacing={0}
      className={cn("rounded-lg border border-border bg-card p-1", className)}
    >
      {RATING_KEYS.map((key) => (
        <ToggleGroupItem
          key={key}
          value={key}
          className="h-8 rounded-md px-3 text-xs font-medium text-muted-foreground data-[pressed]:bg-primary data-[pressed]:text-primary-foreground sm:text-sm"
        >
          {RATING_LABELS[key]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
