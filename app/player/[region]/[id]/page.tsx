import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PlayerView } from "@/components/player/player-view"
import { parseRating } from "@/lib/ratings"
import { getPlayer, parseRegion } from "@/lib/wargaming"

type Props = {
  params: Promise<{ region: string; id: string }>
  searchParams: Promise<{ rating?: string }>
}

async function load(params: Props["params"]) {
  const { region, id } = await params
  const accountId = Number(id)
  if (!Number.isInteger(accountId) || accountId <= 0) notFound()
  return getPlayer(parseRegion(region), accountId)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const player = await load(params).catch(() => null)
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
