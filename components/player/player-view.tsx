"use client"

import { useState } from "react"
import { RatingToggle } from "@/components/rating-toggle"
import { useI18n } from "@/components/i18n-provider"
import { PlayerHeader } from "@/components/player/player-header"
import { RatingCards } from "@/components/player/rating-cards"
import { StatsGrid } from "@/components/player/stats-grid"
import { PeriodStats } from "@/components/player/period-stats"
import { TierBreakdown } from "@/components/player/tier-breakdown"
import { TankTable } from "@/components/player/tank-table"
import type { RatingKey } from "@/lib/ratings"
import type { PlayerData } from "@/lib/types"

export function PlayerView({ player, initialRating }: { player: PlayerData; initialRating: RatingKey }) {
  const { t } = useI18n()
  const [rating, setRating] = useState(initialRating)

  const changeRating = (next: RatingKey) => {
    setRating(next)
    const url = new URL(window.location.href)
    url.searchParams.set("rating", next)
    window.history.replaceState(null, "", url)
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <PlayerHeader player={player} />
        <RatingToggle value={rating} onChange={changeRating} />
      </div>

      <RatingCards ratings={player.ratings} selected={rating} onSelect={changeRating} />

      {player.hidden && (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          {t.player.hidden}
        </p>
      )}

      {player.periods && <PeriodStats periods={player.periods} />}

      <StatsGrid summary={player.summary} />

      {player.tanks.length > 0 && (
        <>
          <TierBreakdown tanks={player.tanks} rating={rating} />
          <TankTable tanks={player.tanks} rating={rating} />
        </>
      )}
    </main>
  )
}
