import { PlayerSearch } from "@/components/player-search"
import { RatingLegend } from "@/components/rating-legend"
import { getI18n } from "@/lib/i18n/server"

export default async function HomePage() {
  const { t } = await getI18n()
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-4">
      <section className="flex flex-col items-center pt-20 pb-16 text-center sm:pt-28">
        <span className="mb-5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          {t.home.badge}
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          {t.home.titleStart} <span className="text-primary">{t.home.titleAccent}</span>
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-muted-foreground">{t.home.description}</p>
        <div className="mt-10 w-full max-w-2xl text-left">
          <PlayerSearch size="lg" />
          <p className="mt-3 text-center text-xs text-muted-foreground">{t.home.hint}</p>
        </div>
      </section>
      <RatingLegend />
    </main>
  )
}
