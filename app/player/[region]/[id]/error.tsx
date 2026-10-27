"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/components/i18n-provider"

export default function PlayerError({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n()
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t.player.errorTitle}</h1>
      <p className="text-muted-foreground">{error.message || t.player.errorDefault}</p>
      <div className="flex gap-2">
        <Button onClick={reset}>{t.player.retry}</Button>
        <Button variant="outline" render={<Link href="/" />}>
          {t.player.home}
        </Button>
      </div>
    </main>
  )
}
