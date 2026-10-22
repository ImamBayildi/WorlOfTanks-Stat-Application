const intFormat = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 })
const decFormat = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dateFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" })

export function formatInt(value: number | null | undefined) {
  return value == null ? "—" : intFormat.format(value)
}

export function formatDecimal(value: number | null | undefined) {
  return value == null ? "—" : decFormat.format(value)
}

export function formatPercent(value: number | null | undefined) {
  return value == null ? "—" : `%${decFormat.format(value)}`
}

export function formatDate(unixSeconds: number | null | undefined) {
  return unixSeconds ? dateFormat.format(new Date(unixSeconds * 1000)) : "—"
}

export const TANK_TYPE_LABELS: Record<string, string> = {
  lightTank: "Hafif",
  mediumTank: "Orta",
  heavyTank: "Ağır",
  "AT-SPG": "Tank Avcısı",
  SPG: "Topçu",
}

export const TANK_TYPE_SHORT: Record<string, string> = {
  lightTank: "LT",
  mediumTank: "MT",
  heavyTank: "HT",
  "AT-SPG": "TD",
  SPG: "SPG",
}

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"]

export function toRoman(tier: number) {
  return ROMAN[tier] ?? String(tier)
}
