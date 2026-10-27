import type { Metadata } from "next"
import { Code2, Server, Sparkles } from "lucide-react"
import { DonateForm } from "@/components/donate/donate-form"
import { getI18n } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.nav.donate, description: t.meta.donateDescription }
}

const ICONS = [Server, Sparkles, Code2]

export default async function DonatePage() {
  const { t } = await getI18n()
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[1fr_440px] lg:items-start">
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t.donate.title}</h1>
          <p className="max-w-xl text-pretty text-muted-foreground">{t.donate.intro}</p>
        </header>
        <ul className="flex flex-col gap-3">
          {t.donate.reasons.map(({ title, text }, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <li key={title} className="flex gap-3 rounded-lg border border-border bg-card p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-sm font-medium">{title}</h2>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-label={t.donate.formLabel} className="rounded-xl border border-border bg-card p-5 sm:p-6">
        {publishableKey ? (
          <DonateForm publishableKey={publishableKey} />
        ) : (
          <p className="text-sm text-muted-foreground">{t.donate.notConfigured}</p>
        )}
      </section>
    </main>
  )
}
