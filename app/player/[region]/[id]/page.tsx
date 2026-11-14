import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PlayerView } from "@/components/player/player-view"
import { PlayerSourceUnavailable } from "@/components/player/source-status"
import { parseRating } from "@/lib/ratings"
import { getTrackedPlayer } from "@/lib/tracking"
import { getPlayerBundle, parseRegion, WargamingError } from "@/lib/wargaming"

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
  try {
    return { player: await getTrackedPlayer(region, accountId), sourceError: null }
  } catch (error) {
    if (error instanceof WargamingError) return { player: null, sourceError: error.code }
    throw error
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, accountId } = await resolve(params)
  const player = (await getPlayerBundle(region, accountId).catch(() => null))?.player
  if (!player) return { title: "Player not found" }
  return {
    title: `${player.nickname} — Wotrate`,
    description: `${player.nickname} — WN8 ${player.ratings.wn8 ?? "—"}, WNX ${player.ratings.wnx ?? "—"}, WG ${player.ratings.wg ?? "—"}`,
  }
}

export default async function PlayerPage({ params, searchParams }: Props) {
  const [{ player, sourceError }, sp] = await Promise.all([load(params), searchParams])
  if (sourceError) return <PlayerSourceUnavailable requestLimited={sourceError === "REQUEST_LIMIT_EXCEEDED"} />
  if (!player) notFound()
  return <PlayerView player={player} initialRating={parseRating(sp.rating)} />
}
