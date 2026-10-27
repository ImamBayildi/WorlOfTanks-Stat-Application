"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Languages } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"
import { LOCALE_COOKIE, LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function change(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    startTransition(() => router.refresh())
  }

  return (
    <label className={cn("relative flex items-center", className)}>
      <span className="sr-only">{t.nav.language}</span>
      <Languages className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" aria-hidden="true" />
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => change(e.target.value as Locale)}
        className="h-9 appearance-none rounded-lg border border-border bg-card pl-8 pr-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {`${l.toUpperCase()} · ${LOCALE_NAMES[l]}`}
          </option>
        ))}
      </select>
    </label>
  )
}
