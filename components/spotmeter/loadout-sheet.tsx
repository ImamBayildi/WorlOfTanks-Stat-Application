"use client"

import { useId } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/components/i18n-provider"
import {
  DEFAULT_LOADOUT,
  MAX_EQUIPMENT,
  equipmentCount,
  type BushLevel,
  type Loadout,
  type Situation,
} from "@/lib/spotmeter/calc"
import { cn } from "@/lib/utils"

export type Setup = { loadout: Loadout; situation: Situation }

type TierKey = "optics" | "binoculars" | "ventilation" | "camoNet" | "exhaust"
const TIER_OPTIONS: Record<TierKey, string[]> = {
  optics: ["none", "standard", "bounty", "deluxe"],
  binoculars: ["none", "standard", "deluxe"],
  ventilation: ["none", "standard", "bounty", "deluxe"],
  camoNet: ["none", "standard", "deluxe"],
  exhaust: ["none", "standard", "bounty", "deluxe"],
}
const BUSHES: BushLevel[] = ["none", "light", "dense", "double"]

export const PRESETS: Record<"recon" | "passive" | "stealth", Setup> = {
  recon: {
    loadout: { ...DEFAULT_LOADOUT, optics: "standard", ventilation: "standard", camoNet: "none", commandersVision: true },
    situation: { moving: true, fired: false, bush: "none", bushFar: false },
  },
  passive: {
    loadout: { ...DEFAULT_LOADOUT, optics: "standard", binoculars: "standard", camoNet: "standard", ventilation: "none" },
    situation: { moving: false, fired: false, bush: "dense", bushFar: true },
  },
  stealth: {
    loadout: { ...DEFAULT_LOADOUT, optics: "none", camoNet: "standard", ventilation: "standard", exhaust: "standard", camoPaint: true, exhaustInsulation: true },
    situation: { moving: false, fired: false, bush: "dense", bushFar: false },
  },
}

const selectClass =
  "h-8 rounded-md border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"

function Row({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <label htmlFor={htmlFor} className="flex flex-col text-sm">
        <span>{label}</span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </label>
      {children}
    </div>
  )
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
        {aside}
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </section>
  )
}

export function LoadoutSheet({
  open,
  onOpenChange,
  name,
  value,
  onChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  value: Setup
  onChange: (next: Setup) => void
}) {
  const { t } = useI18n()
  const uid = useId()
  const { loadout: l, situation: s } = value
  const used = equipmentCount(l)
  const full = used >= MAX_EQUIPMENT

  const setL = (patch: Partial<Loadout>) => onChange({ loadout: { ...l, ...patch }, situation: s })
  const setS = (patch: Partial<Situation>) => onChange({ loadout: l, situation: { ...s, ...patch } })

  const tierRow = (key: TierKey) => {
    const id = `${uid}-${key}`
    const blocked = full && l[key] === "none"
    return (
      <Row key={key} label={t.spot.equipment[key]} hint={blocked ? t.spot.slotsFull : undefined} htmlFor={id}>
        <select
          id={id}
          className={selectClass}
          value={l[key]}
          disabled={blocked}
          onChange={(e) => setL({ [key]: e.target.value } as Partial<Loadout>)}
        >
          {TIER_OPTIONS[key].map((o) => (
            <option key={o} value={o}>
              {t.spot.tiers[o as keyof typeof t.spot.tiers]}
            </option>
          ))}
        </select>
      </Row>
    )
  }

  const switchRow = (key: keyof Loadout, label: string, opts?: { disabled?: boolean; hint?: string }) => {
    const id = `${uid}-${key}`
    return (
      <Row key={key} label={label} hint={opts?.hint} htmlFor={id}>
        <Switch
          id={id}
          checked={Boolean(l[key])}
          disabled={opts?.disabled}
          onCheckedChange={(checked) => setL({ [key]: checked } as Partial<Loadout>)}
        />
      </Row>
    )
  }

  const cvsBlocked = full && !l.commandersVision

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>{t.spot.configTitle(name)}</SheetTitle>
          <SheetDescription>{t.spot.configDescription}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t.spot.presets}</span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["recon", t.spot.presetRecon],
                  ["passive", t.spot.presetPassive],
                  ["stealth", t.spot.presetStealth],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange(structuredClone(PRESETS[key]))}
                  className="h-8 rounded-md border border-border bg-background text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Section
            title={t.spot.sections.equipment}
            aside={
              <span className={cn("text-xs tabular-nums", full ? "text-primary" : "text-muted-foreground")}>
                {t.spot.equipmentCount(used, MAX_EQUIPMENT)}
              </span>
            }
          >
            {tierRow("optics")}
            {tierRow("binoculars")}
            {tierRow("ventilation")}
            {tierRow("camoNet")}
            {tierRow("exhaust")}
            {switchRow("commandersVision", t.spot.equipment.commandersVision, {
              disabled: cvsBlocked,
              hint: cvsBlocked ? t.spot.slotsFull : undefined,
            })}
          </Section>

          <Section title={t.spot.sections.skills}>
            {switchRow("camouflageSkill", t.spot.skills.camouflageSkill)}
            {switchRow("recon", t.spot.skills.recon)}
            {switchRow("situationalAwareness", t.spot.skills.situationalAwareness)}
            {switchRow("brothersInArms", t.spot.skills.brothersInArms)}
          </Section>

          <Section title={t.spot.sections.boosts}>
            {switchRow("food", t.spot.boosts.food)}
            {switchRow("camoPaint", t.spot.boosts.camoPaint)}
            {switchRow("opticalCalibration", t.spot.boosts.opticalCalibration, {
              disabled: l.optics === "none",
              hint: l.optics === "none" ? t.spot.requires(t.spot.equipment.optics) : undefined,
            })}
            {switchRow("ventPurge", t.spot.boosts.ventPurge, {
              disabled: l.ventilation === "none",
              hint: l.ventilation === "none" ? t.spot.requires(t.spot.equipment.ventilation) : undefined,
            })}
            {switchRow("exhaustInsulation", t.spot.boosts.exhaustInsulation, {
              disabled: l.exhaust === "none",
              hint: l.exhaust === "none" ? t.spot.requires(t.spot.equipment.exhaust) : undefined,
            })}
          </Section>

          <Section title={t.spot.sections.situation}>
            <Row label={t.spot.situation.moving} htmlFor={`${uid}-moving`}>
              <Switch id={`${uid}-moving`} checked={s.moving} onCheckedChange={(moving) => setS({ moving })} />
            </Row>
            <Row label={t.spot.situation.fired} htmlFor={`${uid}-fired`}>
              <Switch id={`${uid}-fired`} checked={s.fired} onCheckedChange={(fired) => setS({ fired })} />
            </Row>
            <Row label={t.spot.situation.bush} htmlFor={`${uid}-bush`}>
              <select
                id={`${uid}-bush`}
                className={selectClass}
                value={s.bush}
                onChange={(e) => setS({ bush: e.target.value as BushLevel })}
              >
                {BUSHES.map((b) => (
                  <option key={b} value={b}>
                    {t.spot.bushes[b]}
                  </option>
                ))}
              </select>
            </Row>
            <Row label={t.spot.situation.bushFar} hint={t.spot.situation.bushFarHint} htmlFor={`${uid}-bushFar`}>
              <Switch
                id={`${uid}-bushFar`}
                checked={s.bushFar}
                disabled={s.bush === "none"}
                onCheckedChange={(bushFar) => setS({ bushFar })}
              />
            </Row>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
