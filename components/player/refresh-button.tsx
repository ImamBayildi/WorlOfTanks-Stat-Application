"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RotateCw } from "lucide-react"
import { refreshPlayer } from "@/app/player/[region]/[id]/actions"
import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import type { Region } from "@/lib/types"

function formatRemaining(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function RefreshButton({
  region,
  accountId,
  nextRefreshAt,
}: {
  region: Region
  accountId: number
  nextRefreshAt: number | null | undefined
}) {
  const { t } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [retryAt, setRetryAt] = useState(nextRefreshAt ?? 0)
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => setRetryAt(nextRefreshAt ?? 0), [nextRefreshAt])

  const remaining = Math.max(0, retryAt - now)
  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(id)
  }, [remaining > 0])

  const onClick = () =>
    startTransition(async () => {
      const result = await refreshPlayer(region, accountId)
      const current = Math.floor(Date.now() / 1000)
      setNow(current)
      setRetryAt(result.ok ? current + 600 : result.retryAt)
      if (result.ok) router.refresh()
    })

  const disabled = pending || remaining > 0
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={disabled} aria-live="polite">
      <RotateCw className={pending ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
      {pending ? t.player.refreshing : remaining > 0 ? t.player.refreshIn(formatRemaining(remaining)) : t.player.refresh}
    </Button>
  )
}
