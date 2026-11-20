"use client"

import { useEffect, useRef, useState } from "react"
import { useI18n } from "@/components/i18n-provider"
import { ADSENSE_PUBLISHER_ID, ADSENSE_SLOTS } from "@/lib/adsense"

declare global {
  interface Window { adsbygoogle?: Array<Record<string, unknown>> }
}

export function AdPlacement({ placement }: { placement: "home" | "player" }) {
  const { locale } = useI18n()
  const element = useRef<HTMLModElement>(null)
  const requested = useRef(false)
  const [nearby, setNearby] = useState(false)
  const container = useRef<HTMLElement>(null)
  const publisher = ADSENSE_PUBLISHER_ID
  const slot = ADSENSE_SLOTS[placement]
  const enabled = process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ADSENSE_READY === "true" && /^ca-pub-\d{16}$/.test(publisher) && /^\d+$/.test(slot)
  const preview = process.env.NODE_ENV === "development"
  const label = { tr: "Reklam", en: "Advertisement", ru: "Реклама" }[locale]

  useEffect(() => {
    if (!enabled || !container.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNearby(true); observer.disconnect() }
    }, { rootMargin: "200px" })
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [enabled])

  useEffect(() => {
    if (!enabled || !nearby || requested.current || !element.current || element.current.clientWidth === 0) return
    requested.current = true
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}) } catch { /* Ads must never interrupt statistics. */ }
  }, [enabled, nearby])

  if (!enabled && !preview) return null
  return (
    <aside ref={container} aria-label={label} className="my-6 w-full border-y border-border py-4">
      <p className="mb-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      {enabled ? <>
        <ins ref={element} className="adsbygoogle wotrate-ad" style={{ display: "block" }} data-ad-client={publisher} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
      </> : <div className="wotrate-ad flex items-center justify-center rounded-md border border-dashed border-border bg-card text-xs text-muted-foreground">
        {{ tr: "Reklam yerleşimi önizlemesi", en: "Ad placement preview", ru: "Предпросмотр рекламного места" }[locale]}
      </div>}
    </aside>
  )
}
