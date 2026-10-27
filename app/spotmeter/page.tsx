import type { Metadata } from "next"
import { Spotmeter } from "@/components/spotmeter/spotmeter"
import { getI18n } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.spot.title, description: t.meta.spotmeterDescription }
}

export default async function SpotmeterPage() {
  const { t } = await getI18n()
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{t.spot.title}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-pretty text-muted-foreground">{t.spot.intro}</p>
      </header>
      <Spotmeter />
    </main>
  )
}
