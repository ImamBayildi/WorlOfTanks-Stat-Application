import { RatingValue } from "@/components/rating-value"
import { tintStyle } from "@/components/stat-tile"
import { getScaleStep, RATING_KEYS, RATING_LABELS, SCALES, type RatingKey } from "@/lib/ratings"
import type { Ratings } from "@/lib/types"
import { cn } from "@/lib/utils"

export function RatingCards({
  ratings,
  selected,
  onSelect,
}: {
  ratings: Ratings
  selected: RatingKey
  onSelect: (key: RatingKey) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {RATING_KEYS.map((key) => {
        const value = ratings[key]
        const step = getScaleStep(key, value)
        const scale = SCALES[key]
        const index = step ? scale.indexOf(step) : -1
        const active = key === selected
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={active}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-xl border bg-card p-5 text-left transition-[box-shadow,transform] hover:-translate-y-0.5",
              step ? "" : "border-border",
              active && "ring-2 ring-primary/70 ring-offset-2 ring-offset-background",
            )}
            style={tintStyle(step?.color, active ? 20 : 12)}
          >
            <span
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ backgroundColor: step?.color ?? "transparent" }}
              aria-hidden="true"
            />
            <span className="flex items-center justify-between text-sm text-muted-foreground">
              {RATING_LABELS[key]}
              {active && <span className="text-xs text-primary">Seçili</span>}
            </span>
            <RatingValue scale={key} value={value} className="mt-2 text-4xl" />
            <span className="mt-1 text-sm" style={{ color: step?.color }}>
              {step?.label ?? "Veri yok"}
            </span>
            <span className="mt-4 flex gap-1" aria-hidden="true">
              {scale.map((s, i) => (
                <span
                  key={s.label}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ backgroundColor: i <= index ? s.color : "var(--muted)" }}
                />
              ))}
            </span>
          </button>
        )
      })}
    </div>
  )
}
