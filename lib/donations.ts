export const DONATION_PRESETS = [3, 5, 10, 25] as const
export const DONATION_MIN = 1
export const DONATION_MAX = 500

export function isValidDonationAmount(amount: unknown): amount is number {
  return (
    typeof amount === "number" &&
    Number.isInteger(amount) &&
    amount >= DONATION_MIN &&
    amount <= DONATION_MAX
  )
}
