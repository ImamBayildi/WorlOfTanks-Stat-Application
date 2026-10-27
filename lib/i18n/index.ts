import en from "./dictionaries/en"
import ru from "./dictionaries/ru"
import tr, { type Dictionary } from "./dictionaries/tr"
import { INTL_LOCALE, type Locale } from "./config"

export type { Dictionary }

const DICTIONARIES: Record<Locale, Dictionary> = { tr, en, ru }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

export type Formatter = ReturnType<typeof createFormatter>

export function createFormatter(locale: Locale) {
  const tag = INTL_LOCALE[locale]
  const int = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 })
  const dec = new Intl.NumberFormat(tag, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const pct = new Intl.NumberFormat(tag, { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const date = new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", year: "numeric" })
  return {
    int: (v: number | null | undefined) => (v == null ? "—" : int.format(v)),
    dec: (v: number | null | undefined) => (v == null ? "—" : dec.format(v)),
    pct: (v: number | null | undefined) => (v == null ? "—" : pct.format(v / 100)),
    date: (unixSeconds: number | null | undefined) => (unixSeconds ? date.format(new Date(unixSeconds * 1000)) : "—"),
  }
}
