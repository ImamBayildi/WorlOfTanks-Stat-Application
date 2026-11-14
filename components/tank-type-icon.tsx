import type { CSSProperties } from "react"
import type { TankType } from "@/lib/types"
import { cn } from "@/lib/utils"

type FlagPalette = {
  colors: string[]
  direction?: "horizontal" | "vertical" | "diagonal"
}

const NATION_PALETTES: Record<string, FlagPalette> = {
  ussr: { colors: ["#f7f7f7", "#2767b0", "#d52b1e"] },
  germany: { colors: ["#171717", "#dd232d", "#f4c430"] },
  usa: { colors: ["#b22234", "#f7f7f7", "#3c3b6e"], direction: "diagonal" },
  france: { colors: ["#2455a4", "#f7f7f7", "#e43d45"], direction: "vertical" },
  uk: { colors: ["#18356f", "#f7f7f7", "#c8102e"], direction: "diagonal" },
  china: { colors: ["#de2910", "#ffde00"] },
  japan: { colors: ["#f7f7f7", "#bc002d"] },
  czech: { colors: ["#f7f7f7", "#d7141a", "#11457e"], direction: "diagonal" },
  sweden: { colors: ["#1261a0", "#f6c900"] },
  poland: { colors: ["#f7f7f7", "#dc143c"] },
  italy: { colors: ["#159447", "#f7f7f7", "#ce2b37"], direction: "vertical" },
}

const TYPE_ICON_PATHS: Record<TankType, string> = {
  lightTank: "/icons/tank-types/light.svg",
  mediumTank: "/icons/tank-types/medium.svg",
  heavyTank: "/icons/tank-types/heavy.svg",
  "AT-SPG": "/icons/tank-types/tank-destroyer.svg",
  SPG: "/icons/tank-types/spg.svg",
}

function flagGradient({ colors, direction = "horizontal" }: FlagPalette) {
  const angle = direction === "vertical" ? "90deg" : direction === "diagonal" ? "135deg" : "180deg"
  const bandSize = 100 / colors.length
  const stops = colors.flatMap((color, index) => [
    `${color} ${index * bandSize}%`,
    `${color} ${(index + 1) * bandSize}%`,
  ])

  return `linear-gradient(${angle}, ${stops.join(", ")})`
}

export function TankTypeIcon({
  type,
  nation,
  label,
  className,
}: {
  type: TankType
  nation: string
  label?: string
  className?: string
}) {
  const iconPath = TYPE_ICON_PATHS[type]
  const palette = NATION_PALETTES[nation] ?? { colors: ["#d9dde2", "#78818d"] }
  const style = {
    backgroundImage: flagGradient(palette),
    maskImage: `url("${iconPath}")`,
    maskPosition: "center",
    maskRepeat: "no-repeat",
    maskSize: "contain",
    WebkitMaskImage: `url("${iconPath}")`,
    WebkitMaskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
  } satisfies CSSProperties

  return (
    <span
      role={label ? "img" : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn("size-5 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]", className)}
      style={style}
    />
  )
}
