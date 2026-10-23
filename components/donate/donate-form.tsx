"use client"

import { useCallback, useMemo, useState } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { ArrowLeft, Heart } from "lucide-react"
import { startDonationSession } from "@/app/actions/donate"
import { DONATION_MAX, DONATION_MIN, DONATION_PRESETS, isValidDonationAmount } from "@/lib/donations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

let stripePromise: ReturnType<typeof loadStripe> | null = null
function getStripe(publishableKey: string) {
  stripePromise ??= loadStripe(publishableKey)
  return stripePromise
}

export function DonateForm({ publishableKey }: { publishableKey: string }) {
  const [selected, setSelected] = useState<number | null>(10)
  const [custom, setCustom] = useState("")
  const [checkoutAmount, setCheckoutAmount] = useState<number | null>(null)

  const amount = custom !== "" ? Number(custom) : selected
  const valid = isValidDonationAmount(amount)

  if (checkoutAmount !== null) {
    return (
      <DonationCheckout
        amount={checkoutAmount}
        publishableKey={publishableKey}
        onBack={() => setCheckoutAmount(null)}
      />
    )
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) setCheckoutAmount(amount)
      }}
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium">Bağış tutarı seçin</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DONATION_PRESETS.map((v) => {
            const active = custom === "" && selected === v
            return (
              <button
                key={v}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelected(v)
                  setCustom("")
                }}
                className={cn(
                  "rounded-lg border px-4 py-4 text-center transition-colors",
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-secondary/40 hover:border-primary/50",
                )}
              >
                <span className="block font-mono text-2xl font-semibold tabular-nums">{`$${v}`}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="custom-amount">Ya da farklı bir tutar girin (USD)</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="custom-amount"
            type="number"
            inputMode="numeric"
            min={DONATION_MIN}
            max={DONATION_MAX}
            step={1}
            placeholder="örn. 15"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="pl-7 font-mono tabular-nums"
            aria-invalid={custom !== "" && !valid}
            aria-describedby="custom-amount-hint"
          />
        </div>
        <p id="custom-amount-hint" className={cn("text-xs", custom !== "" && !valid ? "text-destructive" : "text-muted-foreground")}>
          {`${DONATION_MIN} - ${DONATION_MAX} USD arasında tam sayı.`}
        </p>
      </div>

      <Button type="submit" size="lg" disabled={!valid} className="gap-2">
        <Heart className="size-4" aria-hidden="true" />
        {valid ? `$${amount} bağış yap` : "Tutar seçin"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Ödemeler Stripe ile güvenle işlenir. Kart bilgileriniz bize ulaşmaz.
      </p>
    </form>
  )
}

function DonationCheckout({
  amount,
  publishableKey,
  onBack,
}: {
  amount: number
  publishableKey: string
  onBack: () => void
}) {
  const idempotencyKey = useMemo(() => crypto.randomUUID(), [])
  const fetchClientSecret = useCallback(
    () => startDonationSession(amount, idempotencyKey),
    [amount, idempotencyKey],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 px-2">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Tutarı değiştir
        </Button>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{`$${amount} USD`}</span>
      </div>
      <div id="checkout" className="overflow-hidden rounded-lg bg-white">
        <EmbeddedCheckoutProvider stripe={getStripe(publishableKey)} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  )
}
