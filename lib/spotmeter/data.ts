import "server-only"
import type { TankClass, TankSpec } from "./calc"

const API = "https://tanks.gg/api"
const DAY = 60 * 60 * 24
const HIDDEN_TAGS = /event_battles|testTank|mode_hidden|maps_training|epic_battles|bob\b|fallout|comp7/

export type TankListItem = { slug: string; name: string; tier: number; type: TankClass; nation: string }

type RawListTank = { slug: string; name: string; tier: number; type: TankClass; nation: string; tags: string }

export async function getTankList(): Promise<TankListItem[]> {
  const res = await fetch(`${API}/list`, { next: { revalidate: DAY } })
  if (!res.ok) throw new Error(`Tank list request failed (${res.status})`)
  const { tanks } = (await res.json()) as { tanks: RawListTank[] }
  const seen = new Set<string>()
  return tanks
    .filter((t) => !HIDDEN_TAGS.test(t.tags))
    .filter((t) => {
      const key = `${t.name}|${t.tier}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(({ slug, name, tier, type, nation }) => ({ slug, name, tier, type, nation }))
    .sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name))
}

type RawTurret = { id: number; view_range: number; camo_factor: number }
type RawGun = { turret_id: number; camo_fire_penalty: number }
type RawTank = {
  slug: string
  name: string
  short_name: string
  tier: number
  type: TankClass
  nation: string
  camo_still: number
  camo_moving: number
  camo_paint: number
  turrets: RawTurret[]
  guns: RawGun[]
}

export async function getTankSpec(slug: string): Promise<TankSpec | null> {
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return null
  const res = await fetch(`${API}/tank/${slug}`, { next: { revalidate: DAY } })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Tank request failed (${res.status})`)
  const { tank } = (await res.json()) as { tank?: RawTank }
  if (!tank?.turrets?.length) return null

  const turret = tank.turrets[tank.turrets.length - 1]
  const guns = tank.guns.filter((g) => g.turret_id === turret.id)
  const gun = guns[guns.length - 1] ?? tank.guns[tank.guns.length - 1]

  return {
    slug: tank.slug,
    name: tank.name,
    shortName: tank.short_name,
    tier: tank.tier,
    type: tank.type,
    nation: tank.nation,
    viewRange: turret.view_range,
    camoStill: tank.camo_still,
    camoMoving: tank.camo_moving,
    camoPaint: tank.camo_paint ?? 0,
    turretCamoFactor: turret.camo_factor || 1,
    firePenalty: gun?.camo_fire_penalty ?? 1,
  }
}
