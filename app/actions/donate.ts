"use server"

import { randomUUID } from "node:crypto"
import { stripe } from "@/lib/stripe"
import { DONATION_MAX, DONATION_MIN, isValidDonationAmount } from "@/lib/donations"

export async function startDonationSession(amountUsd: number, idempotencyKey?: string) {
  if (!isValidDonationAmount(amountUsd)) {
    throw new Error(`Bağış tutarı ${DONATION_MIN}-${DONATION_MAX} USD arasında tam sayı olmalıdır.`)
  }

  const session = await stripe.checkout.sessions.create(
    {
      ui_mode: "embedded_page",
      redirect_on_completion: "never",
      submit_type: "donate",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Wotrate Donation",
              description: "Support the development of Wotrate",
            },
            unit_amount: amountUsd * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
    },
    { idempotencyKey: idempotencyKey ?? randomUUID() },
  )

  return session.client_secret as string
}
