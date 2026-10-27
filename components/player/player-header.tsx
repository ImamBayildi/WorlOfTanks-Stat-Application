"use client"

import { CalendarDays, Clock } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"
import type { PlayerData } from "@/lib/types"

const REGION_LABELS = { eu: "EU", com: "NA", asia: "ASIA" } as const

export function PlayerHeader({ player }: { player: PlayerData }) {
  const { t, f } = useI18n()
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-border bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {REGION_LABELS[player.region]}
        </span>
        {player.clan && (
          <span
            className="rounded-md px-2 py-0.5 font-mono text-xs font-semibold"
            style={{ backgroundColor: `${player.clan.color}26`, color: player.clan.color }}
            title={player.clan.name}
          >
            {`[${player.clan.tag}]`}
          </span>
        )}
      </div>
      <h1 className="mt-2 truncate text-3xl font-semibold tracking-tight sm:text-4xl">{player.nickname}</h1>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {`${t.player.registered}: ${f.date(player.createdAt)}`}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden="true" />
          {`${t.player.lastBattle}: ${f.date(player.lastBattleAt)}`}
        </span>
      </div>
    </div>
  )
}
