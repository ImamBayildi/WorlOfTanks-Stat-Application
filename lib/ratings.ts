export type RatingKey = "wn8" | "wnx" | "wg"

export const RATING_KEYS: RatingKey[] = ["wn8", "wnx", "wg"]

export const RATING_LABELS: Record<RatingKey, string> = {
  wn8: "WN8",
  wnx: "WNX",
  wg: "WoT Reytingi",
}

export const RATING_DESCRIPTIONS: Record<RatingKey, string> = {
  wn8: "Hasar, imha, spot, savunma ve galibiyet oranını tank bazlı beklenen değerlerle karşılaştıran topluluk standardı.",
  wnx: "Tomato.gg tarafından geliştirilen, asist hasarını da hesaba katan ve medyan oyuncuyu baz alan modern performans puanı.",
  wg: "Wargaming'in resmi Kişisel Reytingi. Oyun içi istatistiklerde görünen genel puan.",
}

export function parseRating(value: string | undefined | null): RatingKey {
  return value === "wnx" || value === "wg" ? value : "wn8"
}

export interface Totals {
  battles: number
  wins: number
  damage: number
  frags: number
  spots: number
  def: number
  assist: number
}

export interface Wn8Expected {
  damage: number
  frags: number
  spots: number
  def: number
  winRate: number
}

export interface WnxExpected {
  damage: number
  frags: number
  spots: number
  assist: number
}

export function calcWn8(a: Totals, e: Omit<Totals, "battles" | "assist">): number | null {
  if (!a.battles || !e.damage || !e.frags || !e.spots || !e.def || !e.wins) return null
  const rDAMAGE = a.damage / e.damage
  const rSPOT = a.spots / e.spots
  const rFRAG = a.frags / e.frags
  const rDEF = a.def / e.def
  const rWIN = a.wins / e.wins

  const rWINc = Math.max(0, (rWIN - 0.71) / (1 - 0.71))
  const rDAMAGEc = Math.max(0, (rDAMAGE - 0.22) / (1 - 0.22))
  const rFRAGc = Math.max(0, Math.min(rDAMAGEc + 0.2, (rFRAG - 0.12) / (1 - 0.12)))
  const rSPOTc = Math.max(0, Math.min(rDAMAGEc + 0.1, (rSPOT - 0.38) / (1 - 0.38)))
  const rDEFc = Math.max(0, Math.min(rDAMAGEc + 0.1, (rDEF - 0.1) / (1 - 0.1)))

  return Math.round(
    980 * rDAMAGEc +
      210 * rDAMAGEc * rFRAGc +
      155 * rFRAGc * rSPOTc +
      75 * rDEFc * rFRAGc +
      145 * Math.min(1.8, rWINc),
  )
}

export function calcWnx(
  a: Totals,
  e: { damage: number; frags: number; spots: number; assist: number },
): number | null {
  if (!a.battles || !e.damage || !e.frags || !e.spots) return null
  const combinedDamage = a.damage + 0.67 * a.assist
  const combinedExpDamage = e.damage + 0.67 * e.assist

  const rDAMAGE = combinedDamage / combinedExpDamage
  const rDAMAGEc = Math.max(0, rDAMAGE - 0.22)
  const rFRAGS = a.frags / e.frags
  const rSPOTS = a.spots / e.spots
  const rFRAGSc = Math.max(0, Math.min(rDAMAGEc + 0.4, (rFRAGS - 0.12) / 0.88))
  const rSPOTSc = Math.max(0, Math.min(rDAMAGEc + 0.2, (rSPOTS - 0.38) / 0.62))

  const raw = 750 * rDAMAGEc + 200 * rFRAGSc + 50 * rSPOTSc
  return Math.round(raw * Math.pow(raw / 1000, 0.45) * 1.65)
}

export interface ScaleStep {
  max: number
  color: string
  label: string
  level: number
}

const SKILL_COLORS = [
  "#b62324",
  "#e5534b",
  "#f0883e",
  "#e3c341",
  "#9ccc3c",
  "#4fb064",
  "#4ab3d4",
  "#539bf5",
  "#a371f7",
  "#d2a8ff",
]

const SKILL_LABELS = [
  "Çok Kötü",
  "Kötü",
  "Ortanın Altı",
  "Ortalama",
  "Ortanın Üstü",
  "İyi",
  "Çok İyi",
  "Harika",
  "Unicum",
  "Süper Unicum",
]

function buildScale(thresholds: number[]): ScaleStep[] {
  return thresholds.map((max, i) => ({ max, color: SKILL_COLORS[i], label: SKILL_LABELS[i], level: i }))
}

export const SCALES: Record<RatingKey | "winRate", ScaleStep[]> = {
  wn8: buildScale([300, 450, 650, 900, 1200, 1600, 2000, 2450, 2900, Infinity]),
  wnx: buildScale([300, 450, 650, 900, 1200, 1600, 2000, 2450, 2900, Infinity]),
  wg: buildScale([2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10500, Infinity]),
  winRate: buildScale([46, 47, 48, 49, 51, 53, 55, 60, 65, Infinity]),
}

export function getScaleStep(key: keyof typeof SCALES, value: number | null | undefined): ScaleStep | null {
  if (value == null || Number.isNaN(value)) return null
  return SCALES[key].find((s) => value < s.max) ?? SCALES[key][SCALES[key].length - 1]
}

export function getRatingColor(key: keyof typeof SCALES, value: number | null | undefined): string | undefined {
  return getScaleStep(key, value)?.color
}
