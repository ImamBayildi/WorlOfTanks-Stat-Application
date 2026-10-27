import "server-only"
import { cache } from "react"
import { cookies, headers } from "next/headers"
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALES, type Locale } from "./config"
import { createFormatter, getDictionary } from "./index"

export const getLocale = cache(async (): Promise<Locale> => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value
  if (isLocale(fromCookie)) return fromCookie

  const accept = (await headers()).get("accept-language") ?? ""
  for (const part of accept.split(",")) {
    const lang = part.trim().slice(0, 2).toLowerCase()
    if (isLocale(lang)) return lang
  }
  return DEFAULT_LOCALE
})

export async function getI18n() {
  const locale = await getLocale()
  return { locale, t: getDictionary(locale), f: createFormatter(locale) }
}

export { LOCALES }
