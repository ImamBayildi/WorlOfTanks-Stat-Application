"use client"

import { useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { Eye, EyeOff, Gauge, Leaf, Loader2, SlidersHorizontal, X } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"
import { DEFAULT_LOADOUT, DEFAULT_SITUATION, spotDistance, viewRange, type TankSpec } from "@/lib/spotmeter/calc"
import type { TankListItem } from "@/lib/spotmeter/data"
import { cn } from "@/lib/utils"
import { LoadoutSheet, type Setup } from "./loadout-sheet"
import { SpotRadar, outcome } from "./spot-radar"
import { TankPicker, roman } from "./tank-picker"

const MAX_TARGETS = 8

type Slot = Setup & { id: string; slug: string }

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

const newSetup = (): Setup => ({ loadout: { ...DEFAULT_LOADOUT }, situation: { ...DEFAULT_SITUATION } })

const INITIAL_TARGETS = ["obj-140", "is-7", "grille-15", "leopard-1", "stb-1"]

const TONE_CLASS = {
  you: "text-emerald-400",
  they: "text-rose-400",
  same: "text-amber-300",
}

export function Spotmeter() {
  const { t, f } = useI18n()
  const counter = useRef(INITIAL_TARGETS.length)
  const [observer, setObserver] = useState<Slot>({ id: "observer", slug: "manticore", ...newSetup() })
  const [targets, setTargets] = useState<Slot[]>(() =>
    INITIAL_TARGETS.map((slug, i) => ({ id: `t${i}`, slug, ...newSetup() })),
  )
  const [editing, setEditing] = useState<string | null>(null)

  const { data: list, error: listError } = useSWR<{ tanks: TankListItem[] }>("/api/spotmeter/tanks", fetcher, {
    revalidateOnFocus: false,
  })
  const tanks = list?.tanks ?? []

  const slugs = useMemo(
    () => [...new Set([observer.slug, ...targets.map((x) => x.slug)])].sort().join(","),
    [observer.slug, targets],
  )
  const { data: specData, error: specError, isLoading } = useSWR<{ specs: Record<string, TankSpec> }>(
    `/api/spotmeter/specs?slugs=${slugs}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  )
  const specs = specData?.specs ?? {}
  const observerSpec = specs[observer.slug]

  const rows = useMemo(() => {
    if (!observerSpec) return []
    const obs = { spec: observerSpec, loadout: observer.loadout, situation: observer.situation }
    return targets.flatMap((slot) => {
      const spec = specs[slot.slug]
      if (!spec) return []
      const tgt = { spec, loadout: slot.loadout, situation: slot.situation }
      const you = spotDistance(obs, tgt)
      const they = spotDistance(tgt, obs)
      return [{ slot, spec, you, they }]
    })
  }, [observerSpec, observer, targets, specs])

  const observerVR = observerSpec ? viewRange(observerSpec, observer.loadout, observer.situation) : null

  const updateSlot = (id: string, next: Partial<Slot>) => {
    if (id === observer.id) setObserver((o) => ({ ...o, ...next }))
    else setTargets((ts) => ts.map((x) => (x.id === id ? { ...x, ...next } : x)))
  }

  const addTarget = (slug: string) => {
    if (targets.length >= MAX_TARGETS) return
    counter.current += 1
    setTargets((ts) => [...ts, { id: `t${counter.current}`, slug, ...newSetup() }])
  }

  const toggleBush = (slot: Slot) =>
    updateSlot(slot.id, {
      situation: { ...slot.situation, bush: slot.situation.bush === "none" ? "dense" : "none" },
    })

  const toggleMoving = (slot: Slot) =>
    updateSlot(slot.id, { situation: { ...slot.situation, moving: !slot.situation.moving } })

  const editingSlot = editing === observer.id ? observer : targets.find((x) => x.id === editing)
  const nameOf = (slug: string) => specs[slug]?.shortName ?? tanks.find((x) => x.slug === slug)?.name ?? slug
  const error = listError || specError

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <section
        aria-label={t.spot.radarLabel}
        className="relative flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6"
      >
        {error ? (
          <p className="py-24 text-sm text-destructive">{t.spot.loadError}</p>
        ) : !observerSpec ? (
          <p className="flex items-center gap-2 py-24 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t.spot.loading}
          </p>
        ) : (
          <SpotRadar
            observerName={observerSpec.shortName}
            observerViewRange={observerVR}
            targets={rows.map((r) => ({
              id: r.slot.id,
              name: r.spec.shortName,
              youSpot: r.you.distance,
              theySpot: r.they.distance,
            }))}
          />
        )}
        {isLoading && observerSpec ? (
          <Loader2 className="absolute top-4 right-4 size-4 animate-spin text-muted-foreground" aria-label={t.spot.loading} />
        ) : null}
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
            {t.spot.youFirst}
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-rose-400" aria-hidden="true" />
            {t.spot.theyFirst}
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full border-2 border-muted-foreground" aria-hidden="true" />
            {t.spot.theySpot}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-0 w-4 border-t-2 border-dashed border-primary" aria-hidden="true" />
            {t.spot.viewRange}
          </li>
        </ul>
      </section>

      <div className="flex flex-col gap-6">
        <section aria-labelledby="observer-heading" className="flex flex-col gap-3 rounded-2xl border border-primary/40 bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 id="observer-heading" className="text-sm font-semibold">
              {t.spot.observer}
            </h2>
            {observerSpec ? (
              <div className="flex gap-3 text-xs text-muted-foreground tabular-nums">
                <span>
                  {t.spot.viewRange}: <span className="font-mono text-foreground">{f.int(observerVR)} m</span>
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <TankPicker tanks={tanks} value={observer.slug} onSelect={(slug) => updateSlot(observer.id, { slug })} />
            </div>
            <SlotActions
              slot={observer}
              onEdit={() => setEditing((cur) => (cur === observer.id ? null : observer.id))}
              onBush={() => toggleBush(observer)}
              onMoving={() => toggleMoving(observer)}
            />
          </div>
        </section>

        <section aria-labelledby="targets-heading" className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="targets-heading" className="text-sm font-semibold">
              {t.spot.targets}
              <span className="ml-2 font-normal text-muted-foreground">
                {targets.length}/{MAX_TARGETS}
              </span>
            </h2>
            <TankPicker
              tanks={tanks}
              onSelect={addTarget}
              variant="add"
              disabled={targets.length >= MAX_TARGETS || !tanks.length}
              label={targets.length >= MAX_TARGETS ? t.spot.maxTargets(MAX_TARGETS) : t.spot.addTarget}
            />
          </div>

          {targets.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              {t.spot.emptyTargets}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {targets.map((slot) => {
                const row = rows.find((r) => r.slot.id === slot.id)
                const res = row ? outcome(row.you.distance, row.they.distance) : null
                const spec = specs[slot.slug]
                return (
                  <li key={slot.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <TankPicker tanks={tanks} value={slot.slug} onSelect={(slug) => updateSlot(slot.id, { slug })} />
                      </div>
                      <SlotActions
                        slot={slot}
                        onEdit={() => setEditing((cur) => (cur === slot.id ? null : slot.id))}
                        onBush={() => toggleBush(slot)}
                        onMoving={() => toggleMoving(slot)}
                      />
                      <button
                        type="button"
                        onClick={() => setTargets((ts) => ts.filter((x) => x.id !== slot.id))}
                        aria-label={`${t.spot.remove}: ${nameOf(slot.slug)}`}
                        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    {row && res ? (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-1 text-xs">
                        <span className="text-muted-foreground">
                          {spec ? `${roman(spec.tier)} · ${t.tankClasses[spec.type]}` : null}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Eye className="size-3.5 text-muted-foreground" aria-hidden="true" />
                          <span className="text-muted-foreground">{t.spot.youSpot}</span>
                          <span className="font-mono font-semibold tabular-nums">{f.int(row.you.distance)} m</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <EyeOff className="size-3.5 text-muted-foreground" aria-hidden="true" />
                          <span className="text-muted-foreground">{t.spot.theySpot}</span>
                          <span className="font-mono font-semibold tabular-nums">{f.int(row.they.distance)} m</span>
                        </span>
                        <span className={cn("ml-auto font-medium", TONE_CLASS[res])}>
                          {res === "you" ? t.spot.youFirst : res === "they" ? t.spot.theyFirst : t.spot.same}
                        </span>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <details className="group rounded-2xl border border-border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-semibold marker:text-muted-foreground">{t.spot.formulaTitle}</summary>
          <p className="mt-3 leading-relaxed text-muted-foreground">{t.spot.formula}</p>
        </details>
      </div>

      {editingSlot ? (
        <LoadoutSheet
          open
          onOpenChange={(open) => !open && setEditing(null)}
          name={nameOf(editingSlot.slug)}
          value={{ loadout: editingSlot.loadout, situation: editingSlot.situation }}
          onChange={(next) => updateSlot(editingSlot.id, next)}
        />
      ) : null}
    </div>
  )
}

function SlotActions({
  slot,
  onEdit,
  onBush,
  onMoving,
}: {
  slot: Slot
  onEdit: () => void
  onBush: () => void
  onMoving: () => void
}) {
  const { t } = useI18n()
  const inBush = slot.situation.bush !== "none"
  const moving = slot.situation.moving
  return (
    <>
      <button
        type="button"
        onClick={onMoving}
        aria-pressed={moving}
        title={t.spot.situation.moving}
        aria-label={t.spot.situation.moving}
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          moving
            ? "border-amber-400/50 bg-amber-400/15 text-amber-300"
            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Gauge className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onBush}
        aria-pressed={inBush}
        title={inBush ? t.spot.bushes[slot.situation.bush] : t.spot.addBush}
        aria-label={t.spot.addBush}
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          inBush
            ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Leaf className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t.spot.configure}</span>
      </button>
    </>
  )
}
