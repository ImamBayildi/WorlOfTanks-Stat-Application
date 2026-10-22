import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10" aria-busy="true">
      <Skeleton className="h-16 max-w-2xl rounded-xl" />
      <div className="mt-10 flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[74px] rounded-xl" />
        ))}
      </div>
      <span className="sr-only">Oyuncular aranıyor…</span>
    </main>
  )
}
