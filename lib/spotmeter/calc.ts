// World of Tanks spotting model.
// Values come from the game client data (via tanks.gg) — see README notes in the UI footnote.

export type TankClass = "light" | "medium" | "heavy" | "td" | "spg"

export type TankSpec = {
  slug: string
  name: string
  shortName: string
  tier: number
  type: TankClass
  nation: string
  viewRange: number
  camoStill: number
  camoMoving: number
  camoPaint: number
  turretCamoFactor: number
  firePenalty: number
}

export type OpticsTier = "none" | "standard" | "bounty" | "deluxe"
export type BinocTier = "none" | "standard" | "deluxe"
export type VentTier = "none" | "standard" | "bounty" | "deluxe"
export type NetTier = "none" | "standard" | "deluxe"
export type ExhaustTier = "none" | "standard" | "bounty" | "deluxe"
export type BushLevel = "none" | "light" | "dense" | "double"

export type Loadout = {
  optics: OpticsTier
  binoculars: BinocTier
  ventilation: VentTier
  camoNet: NetTier
  exhaust: ExhaustTier
  commandersVision: boolean
  camouflageSkill: boolean
  recon: boolean
  situationalAwareness: boolean
  brothersInArms: boolean
  food: boolean
  opticalCalibration: boolean
  ventPurge: boolean
  exhaustInsulation: boolean
  camoPaint: boolean
}

export type Situation = {
  moving: boolean
  fired: boolean
  bush: BushLevel
  bushFar: boolean
}

export const MAX_EQUIPMENT = 3
export const MIN_SPOT = 50
export const MAX_SPOT = 445

const OPTICS: Record<OpticsTier, number> = { none: 1, standard: 1.1, bounty: 1.125, deluxe: 1.135 }
const BINOCS: Record<BinocTier, number> = { none: 1, standard: 1.25, deluxe: 1.275 }
const VENTS: Record<VentTier, number> = { none: 0, standard: 5, bounty: 7.5, deluxe: 8.5 }

const NET: Record<NetTier, Record<TankClass, number>> = {
  none: { light: 0, medium: 0, heavy: 0, td: 0, spg: 0 },
  standard: { light: 0.1, medium: 0.1, heavy: 0.05, td: 0.15, spg: 0.05 },
  deluxe: { light: 0.125, medium: 0.125, heavy: 0.075, td: 0.175, spg: 0.075 },
}

const EXHAUST: Record<ExhaustTier, Record<TankClass, number>> = {
  none: { light: 0, medium: 0, heavy: 0, td: 0, spg: 0 },
  standard: { light: 0.06, medium: 0.06, heavy: 0.03, td: 0.05, spg: 0.03 },
  bounty: { light: 0.09, medium: 0.09, heavy: 0.05, td: 0.07, spg: 0.05 },
  deluxe: { light: 0.1, medium: 0.1, heavy: 0.06, td: 0.08, spg: 0.06 },
}

export const BUSH_BONUS: Record<BushLevel, number> = { none: 0, light: 0.25, dense: 0.5, double: 0.75 }

const CVS_MOVING_FACTOR = 0.9
const CALIBRATION_FACTOR = 1.023
const VENT_PURGE = 2.5
const EXHAUST_INSULATION = 0.02
const FOOD = 10
const BIA = 5

export const DEFAULT_LOADOUT: Loadout = {
  optics: "standard",
  binoculars: "none",
  ventilation: "standard",
  camoNet: "standard",
  exhaust: "none",
  commandersVision: false,
  camouflageSkill: true,
  recon: true,
  situationalAwareness: true,
  brothersInArms: true,
  food: false,
  opticalCalibration: false,
  ventPurge: false,
  exhaustInsulation: false,
  camoPaint: false,
}

export const DEFAULT_SITUATION: Situation = { moving: false, fired: false, bush: "none", bushFar: false }

export function equipmentCount(l: Loadout) {
  return [l.optics !== "none", l.binoculars !== "none", l.ventilation !== "none", l.camoNet !== "none", l.exhaust !== "none", l.commandersVision].filter(Boolean).length
}

/** Crew skill level (100 = fully trained) including ventilation, food, Brothers in Arms and directives. */
export function crewLevel(l: Loadout) {
  let level = 100
  if (l.ventilation !== "none") level += VENTS[l.ventilation] + (l.ventPurge ? VENT_PURGE : 0)
  if (l.food) level += FOOD
  if (l.brothersInArms) level += BIA
  return level
}

export function viewRange(spec: TankSpec, l: Loadout, s: Situation) {
  const level = crewLevel(l)
  let vr = spec.viewRange * (0.57 + (0.43 * level) / 100)
  if (l.recon) vr *= 1 + 0.0002 * level
  if (l.situationalAwareness) vr *= 1 + 0.0003 * level
  const optics = OPTICS[l.optics] * (l.optics !== "none" && l.opticalCalibration ? CALIBRATION_FACTOR : 1)
  const binocs = s.moving ? 1 : BINOCS[l.binoculars]
  return vr * Math.max(optics, binocs)
}

/** Tank concealment (0–1) without terrain. */
export function vehicleCamo(spec: TankSpec, l: Loadout, s: Situation) {
  const skillFactor = l.camouflageSkill ? 0.57 + (0.43 * crewLevel(l)) / 100 : 0.57
  const base = (s.moving ? spec.camoMoving : spec.camoStill) * skillFactor * spec.turretCamoFactor
  const net = s.moving ? 0 : NET[l.camoNet][spec.type]
  const exhaust = EXHAUST[l.exhaust][spec.type]
  let camo = base + Math.max(net, exhaust)
  if (l.camoPaint) camo += spec.camoPaint
  if (l.exhaust !== "none" && l.exhaustInsulation) camo += EXHAUST_INSULATION
  if (s.fired) camo *= spec.firePenalty
  return camo
}

export function bushBonus(s: Situation) {
  if (s.bush === "none") return 0
  if (s.fired && !s.bushFar) return 0
  return BUSH_BONUS[s.bush]
}

export type SpotResult = {
  distance: number
  observerViewRange: number
  targetCamo: number
}

/** Distance (m) at which the observer spots the target. */
export function spotDistance(
  observer: { spec: TankSpec; loadout: Loadout; situation: Situation },
  target: { spec: TankSpec; loadout: Loadout; situation: Situation },
): SpotResult {
  const vr = viewRange(observer.spec, observer.loadout, observer.situation)
  let camo = vehicleCamo(target.spec, target.loadout, target.situation)
  if (target.situation.moving && observer.loadout.commandersVision) camo *= CVS_MOVING_FACTOR
  camo = Math.min(1, Math.max(0, camo + bushBonus(target.situation)))
  const raw = vr - (vr - MIN_SPOT) * camo
  return {
    distance: Math.min(MAX_SPOT, Math.max(MIN_SPOT, raw)),
    observerViewRange: vr,
    targetCamo: camo,
  }
}
