"use client"

import { useI18n } from "@/components/i18n-provider"
import { MAX_SPOT, MIN_SPOT } from "@/lib/spotmeter/calc"

export type RadarTarget = {
  id: string
  name: string
  youSpot: number
  theySpot: number
}

const SIZE = 480
const C = SIZE / 2
const R = 200
const RINGS = [100, 200, 300, 400]

const scale = (m: number) => (Math.min(m, MAX_SPOT) / MAX_SPOT) * R

export function outcome(youSpot: number, theySpot: number) {
  const diff = youSpot - theySpot
  if (Math.abs(diff) < 1) return "same" as const
  return diff > 0 ? ("you" as const) : ("they" as const)
}

const TONE = {
  you: "var(--color-emerald-400)",
  they: "var(--color-rose-400)",
  same: "var(--color-amber-300)",
}

export function SpotRadar({
  observerName,
  observerViewRange,
  targets,
}: {
  observerName: string
  observerViewRange: number | null
  targets: RadarTarget[]
}) {
  const { t, f } = useI18n()
  const n = targets.length

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={t.spot.radarLabel} className="h-auto w-full max-w-[560px]">
      <defs>
        <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={C} cy={C} r={R} fill="url(#radar-bg)" stroke="var(--color-border)" strokeWidth="1.5" />
      {RINGS.map((m) => (
        <g key={m}>
          <circle cx={C} cy={C} r={scale(m)} fill="none" stroke="var(--color-border)" strokeOpacity="0.7" />
          <text x={C + 4} y={C - scale(m) + 12} className="fill-muted-foreground text-[10px]">
            {t.spot.meters(String(m))}
          </text>
        </g>
      ))}
      <line x1={C - R} y1={C} x2={C + R} y2={C} stroke="var(--color-border)" strokeOpacity="0.5" />
      <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="var(--color-border)" strokeOpacity="0.5" />

      <circle
        cx={C}
        cy={C}
        r={scale(MIN_SPOT)}
        fill="var(--color-muted)"
        fillOpacity="0.5"
        stroke="var(--color-muted-foreground)"
        strokeDasharray="3 3"
      >
        <title>{t.spot.ringAuto}</title>
      </circle>

      {observerViewRange ? (
        <circle
          cx={C}
          cy={C}
          r={scale(observerViewRange)}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        >
          <title>{`${t.spot.viewRange}: ${t.spot.meters(f.int(observerViewRange))}`}</title>
        </circle>
      ) : null}

      {targets.map((target, i) => {
        const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const you = scale(target.youSpot)
        const they = scale(target.theySpot)
        const tone = TONE[outcome(target.youSpot, target.theySpot)]
        const x = C + cos * you
        const y = C + sin * you
        const labelR = Math.max(you, they) + 14
        const lx = C + cos * labelR
        const ly = C + sin * labelR
        const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle"
        const dy = sin > 0.35 ? 12 : sin < -0.35 ? -4 : 4

        return (
          <g key={target.id}>
            <line x1={C} y1={C} x2={C + cos * R} y2={C + sin * R} stroke={tone} strokeOpacity="0.18" />
            <line x1={C + cos * they} y1={C + sin * they} x2={x} y2={y} stroke={tone} strokeWidth="2" strokeOpacity="0.5" />
            <circle cx={C + cos * they} cy={C + sin * they} r="5" fill="var(--color-background)" stroke={tone} strokeWidth="2">
              <title>{`${t.spot.theySpot}: ${t.spot.meters(f.int(target.theySpot))}`}</title>
            </circle>
            <circle cx={x} cy={y} r="7" fill={tone} stroke="var(--color-background)" strokeWidth="2">
              <title>{`${t.spot.youSpot}: ${t.spot.meters(f.int(target.youSpot))}`}</title>
            </circle>
            <text x={lx} y={ly + dy} textAnchor={anchor} className="fill-foreground text-[12px] font-medium">
              {target.name}
              <tspan className="fill-muted-foreground font-mono text-[11px]">{`  ${f.int(target.youSpot)} m`}</tspan>
            </text>
          </g>
        )
      })}

      <circle cx={C} cy={C} r="9" fill="var(--color-primary)" stroke="var(--color-background)" strokeWidth="3" />
      <text x={C} y={C + 26} textAnchor="middle" className="fill-foreground text-[12px] font-semibold">
        {observerName}
      </text>
    </svg>
  )
}
