"use server"

import { updateTag } from "next/cache"
import { claimManualRefresh } from "@/lib/tracking"
import type { Region } from "@/lib/types"
import { playerCacheTag, REGIONS } from "@/lib/wargaming"

export type RefreshResult = { ok: true } | { ok: false; retryAt: number }

export async function refreshPlayer(region: string, accountId: number): Promise<RefreshResult> {
  if (!(region in REGIONS) || !Number.isSafeInteger(accountId) || accountId <= 0) {
    return { ok: false, retryAt: 0 }
  }
  const retryAt = await claimManualRefresh(region as Region, accountId)
  if (retryAt) return { ok: false, retryAt }
  updateTag(playerCacheTag(region as Region, accountId))
  return { ok: true }
}
