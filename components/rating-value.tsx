import { formatInt } from "@/lib/format"
import { getRatingColor, type SCALES } from "@/lib/ratings"
import { cn } from "@/lib/utils"

export function RatingValue({
  scale,
  value,
  className,
  children,
}: {
  scale: keyof typeof SCALES
  value: number | null | undefined
  className?: string
  children?: React.ReactNode
}) {
  return (
    <span
      className={cn("font-mono font-semibold tabular-nums", className)}
      style={{ color: getRatingColor(scale, value) ?? "var(--muted-foreground)" }}
    >
      {children ?? formatInt(value)}
    </span>
  )
}
