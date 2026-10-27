"use client"

import { createContext, useContext, useMemo } from "react"
import type { Locale } from "@/lib/i18n/config"
import { createFormatter, getDictionary, type Dictionary, type Formatter } from "@/lib/i18n"

type I18nValue = { locale: Locale; t: Dictionary; f: Formatter }

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, t: getDictionary(locale), f: createFormatter(locale) }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider")
  return ctx
}
