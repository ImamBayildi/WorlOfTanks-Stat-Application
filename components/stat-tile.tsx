import { cn } from "@/lib/utils"

export function tintStyle(color: string | undefined | null, strength = 14): React.CSSProperties | undefined {
  if (!color) return undefined
  return {
    backgroundColor: `color-mix(in oklch, ${color} ${strength}%, transparent)`,
    borderColor: `color-mix(in oklch, ${color} ${strength + 18}%, transparent)`,
  }
}

export function StatTile({
  label,
  value,
  color,
  hint,
  className,
}: {
  label: string
  value: React.ReactNode
  color?: string | null
  hint?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border px-3.5 py-3",
        color ? "" : "border-border bg-secondary/40",
        className,
      )}
      style={tintStyle(color)}
    >
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className="font-mono text-lg font-semibold leading-tight tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
      </dd>
      {hint && <span className="text-[11px] leading-tight text-muted-foreground">{hint}</span>}
    </div>
  )
}
