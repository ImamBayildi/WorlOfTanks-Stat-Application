import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PlayerView } from "@/components/player/player-view"
import { parseRating } from "@/lib/ratings"
import { getTrackedPlayer } from "@/lib/tracking"
import { getPlayerBundle, parseRegion } from "@/lib/wargaming"

type Props = {
  params: Promise<{ region: string; id: string }>
  searchParams: Promise<{ rating?: string }>
}

async function resolve(params: Props["params"]) {
  const { region, id } = await params
  const accountId = Number(id)
  if (!Number.isInteger(accountId) || accountId <= 0) notFound()
  return { region: parseRegion(region), accountId }
}

async function load(params: Props["params"]) {
  const { region, accountId } = await resolve(params)
  return getTrackedPlayer(region, accountId)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, accountId } = await resolve(params)
  const player = (await getPlayerBundle(region, accountId).catch(() => null))?.player
  if (!player) return { title: "Oyuncu bulunamadı" }
  return {
    title: `${player.nickname} istatistikleri`,
    description: `${player.nickname} — WN8 ${player.ratings.wn8 ?? "—"}, WNX ${player.ratings.wnx ?? "—"}, WoT Reytingi ${player.ratings.wg ?? "—"}`,
  }
}

export default async function PlayerPage({ params, searchParams }: Props) {
  const [player, sp] = await Promise.all([load(params), searchParams])
  if (!player) notFound()
  return <PlayerView player={player} initialRating={parseRating(sp.rating)} />
}
