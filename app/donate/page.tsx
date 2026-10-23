import type { Metadata } from "next"
import { Code2, Server, Sparkles } from "lucide-react"
import { DonateForm } from "@/components/donate/donate-form"

export const metadata: Metadata = {
  title: "Donate",
  description: "TankStat'ın geliştirilmesine bağış yaparak destek olun.",
}

const REASONS = [
  { icon: Server, title: "Sunucu ve veritabanı", text: "Günlük istatistik güncellemeleri ve oyuncu geçmişi için altyapı masrafları." },
  { icon: Sparkles, title: "Yeni özellikler", text: "Tank bazlı analizler, klan istatistikleri ve daha fazlası." },
  { icon: Code2, title: "Reklamsız kalması", text: "TankStat ücretsiz ve reklamsız kalmaya devam etsin." },
]

export default function DonatePage() {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[1fr_440px] lg:items-start">
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">TankStat&apos;a destek olun</h1>
          <p className="max-w-xl text-pretty text-muted-foreground">
            TankStat bağımsız bir hobi projesidir. Yapacağınız her bağış, uygulamanın ayakta kalmasına ve yeni
            özelliklerin gelmesine doğrudan katkı sağlar.
          </p>
        </header>
        <ul className="flex flex-col gap-3">
          {REASONS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3 rounded-lg border border-border bg-card p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-sm font-medium">{title}</h2>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Bağış formu" className="rounded-xl border border-border bg-card p-5 sm:p-6">
        {publishableKey ? (
          <DonateForm publishableKey={publishableKey} />
        ) : (
          <p className="text-sm text-muted-foreground">Bağış sistemi şu anda yapılandırılmamış.</p>
        )}
      </section>
    </main>
  )
}
