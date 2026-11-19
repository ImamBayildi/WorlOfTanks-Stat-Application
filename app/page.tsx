import { PlayerSearch } from "@/components/player-search"
import { RatingLegend } from "@/components/rating-legend"
import { getI18n } from "@/lib/i18n/server"
import Link from "next/link"

const answers = {
  tr: {
    heading: "Wotrate nasıl çalışır?",
    items: [
      { question: "Oyuncu istatistiklerini nereden alıyor?", answer: "Wotrate, World of Tanks oyuncu verilerini Wargaming Public API üzerinden alır. WN8 için XVM beklenen değerlerini, WNX için tomato.gg beklenen değerlerini kullanır." },
      { question: "Son 30 gün istatistiği nasıl hesaplanır?", answer: "Oyuncunun güncel toplamları ile yaklaşık 30 gün önce kaydedilmiş toplamları karşılaştırılır. Yeterli geçmiş yoksa sonuç, ilk kayıt tarihinden başlayan kısmi dönemi gösterir." },
      { question: "Oyuncu ve tankları nasıl karşılaştırabilirim?", answer: "Oyuncu adını arayarak genel ve dönemsel istatistikleri inceleyebilir, oyuncu reytinglerini filtreleyebilir ve Spotmeter ile tespit mesafesi hesaplayabilirsiniz." },
    ],
    ratings: "Oyuncu reytinglerini incele",
    spotmeter: "Spotmeter'ı aç",
  },
  en: {
    heading: "How does Wotrate work?",
    items: [
      { question: "Where do player statistics come from?", answer: "Wotrate retrieves World of Tanks player data from the Wargaming Public API. It uses XVM expected values for WN8 and tomato.gg expected values for WNX." },
      { question: "How are the last 30 days calculated?", answer: "Current cumulative totals are compared with a snapshot recorded about 30 days earlier. When less history is available, the result covers a partial period starting at the first snapshot." },
      { question: "How can I compare players and tanks?", answer: "Search for a player to view overall and period statistics, filter player ratings, and use Spotmeter to calculate spotting distances." },
    ],
    ratings: "Explore player ratings",
    spotmeter: "Open Spotmeter",
  },
  ru: {
    heading: "Как работает Wotrate?",
    items: [
      { question: "Откуда берётся статистика игроков?", answer: "Wotrate получает данные World of Tanks через Wargaming Public API. Для WN8 используются ожидаемые значения XVM, а для WNX — tomato.gg." },
      { question: "Как рассчитываются последние 30 дней?", answer: "Текущие суммарные показатели сравниваются со снимком примерно 30-дневной давности. Если история короче, показывается неполный период с даты первого снимка." },
      { question: "Как сравнить игроков и танки?", answer: "Найдите игрока для просмотра общей статистики и статистики за период, отфильтруйте рейтинг игроков и рассчитайте дистанцию обнаружения в Spotmeter." },
    ],
    ratings: "Рейтинг игроков",
    spotmeter: "Открыть Spotmeter",
  },
}

export default async function HomePage() {
  const { t, locale } = await getI18n()
  const guide = answers[locale]
  const siteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Wotrate",
    url: "https://wotrate.com/",
    description: t.meta.description,
    inLanguage: locale,
  }
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema).replace(/</g, "\\u003c") }} />
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
      <section aria-labelledby="wotrate-guide" className="border-t border-border py-10">
        <h2 id="wotrate-guide" className="text-xl font-semibold">{guide.heading}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {guide.items.map((item) => (
            <article key={item.question} className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-medium">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </article>
          ))}
        </div>
        <nav className="mt-5 flex flex-wrap gap-4 text-sm text-primary" aria-label={guide.heading}>
          <Link href="/reytingler" className="hover:underline">{guide.ratings}</Link>
          <Link href="/spotmeter" className="hover:underline">{guide.spotmeter}</Link>
        </nav>
      </section>
    </main>
  )
}
