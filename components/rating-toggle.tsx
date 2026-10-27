"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RATING_KEYS, RATING_LABELS, type RatingKey } from "@/lib/ratings"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"

export function RatingToggle({
  value,
  onChange,
  className,
}: {
  value: RatingKey
  onChange: (value: RatingKey) => void
  className?: string
}) {
  const { t } = useI18n()
  return (
    <ToggleGroup
      aria-label={t.ratings.type}
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
          {key === "wg" ? t.ratings.wg : RATING_LABELS[key]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
