"use client"

import { AlertTriangle, RotateCw } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"

export function PlayerSourceWarning({ updatedAt }: { updatedAt: number }) {
  const { t, f } = useI18n()
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-amber-100">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden="true" />
      <div>
        <p className="font-bold">{t.player.sourceStaleTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-100/80">{t.player.sourceStaleText(f.date(updatedAt))}</p>
      </div>
    </div>
  )
}

export function PlayerSourceUnavailable({ requestLimited }: { requestLimited: boolean }) {
  const { t } = useI18n()
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-4 py-16">
      <div className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-5 text-amber-100">
        <AlertTriangle className="mt-0.5 size-6 shrink-0 text-amber-300" aria-hidden="true" />
        <div>
          <h1 className="text-xl font-bold">{requestLimited ? t.player.sourceLimitedTitle : t.player.errorTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-amber-100/80">
            {requestLimited ? t.player.sourceLimitedText : t.player.errorDefault}
          </p>
        </div>
      </div>
      <Button onClick={() => window.location.reload()}>
        <RotateCw className="size-4" aria-hidden="true" />
        {t.player.retry}
      </Button>
    </main>
  )
}
