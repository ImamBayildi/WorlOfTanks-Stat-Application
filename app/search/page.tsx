import type { Metadata } from "next"
import { SearchForm } from "@/components/search-form"
import { SearchResults } from "@/components/search-results"
import { parseRating } from "@/lib/ratings"
import { parseRegion, searchPlayers, WargamingError } from "@/lib/wargaming"

export const metadata: Metadata = { title: "Oyuncu Arama" }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; region?: string; rating?: string }>
}) {
  const params = await searchParams
  const query = (params.q ?? "").trim()
  const region = parseRegion(params.region)
  const rating = parseRating(params.rating)

  let error: string | null = null
  let results: Awaited<ReturnType<typeof searchPlayers>> = []
  if (query.length >= 3) {
    try {
      results = await searchPlayers(region, query)
    } catch (e) {
      error = e instanceof WargamingError ? e.message : "Arama sırasında bir hata oluştu."
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="max-w-2xl">
        <SearchForm
          key={`${query}-${region}-${rating}`}
          defaultQuery={query}
          defaultRegion={region}
          defaultRating={rating}
        />
      </div>
      <div className="mt-10">
        {query.length < 3 ? (
          <p className="text-muted-foreground">Aramak için en az 3 karakterlik bir nick girin.</p>
        ) : error ? (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            {error}
          </p>
        ) : (
          <SearchResults results={results} region={region} query={query} initialRating={rating} />
        )}
      </div>
    </main>
  )
}
