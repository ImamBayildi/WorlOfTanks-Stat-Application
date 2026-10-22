import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10" aria-busy="true">
      <Skeleton className="h-10 w-64" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-48 rounded-xl" />
      <Skeleton className="mt-6 h-96 rounded-xl" />
      <span className="sr-only">Oyuncu yükleniyor…</span>
    </main>
  )
}
