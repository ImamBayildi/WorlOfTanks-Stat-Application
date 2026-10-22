import { SearchForm } from "@/components/search-form"
import { RatingLegend } from "@/components/rating-legend"

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-4">
      <section className="flex flex-col items-center pt-20 pb-16 text-center sm:pt-28">
        <span className="mb-5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          EU · NA · ASIA sunucuları
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          World of Tanks istatistikleri, <span className="text-primary">tek bakışta.</span>
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-muted-foreground">
          Oyuncu nicki ile arayın; WN8, WNX veya WoT Kişisel Reytingi ile oyuncuları ve tankları dilediğiniz
          ölçüte göre listeleyin.
        </p>
        <div className="mt-10 w-full max-w-2xl">
          <SearchForm />
        </div>
      </section>
      <RatingLegend />
    </main>
  )
}
