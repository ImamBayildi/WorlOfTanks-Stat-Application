"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PlayerError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Oyuncu verileri alınamadı</h1>
      <p className="text-muted-foreground">{error.message || "Wargaming API şu anda yanıt vermiyor."}</p>
      <div className="flex gap-2">
        <Button onClick={reset}>Tekrar dene</Button>
        <Button variant="outline" render={<Link href="/" />}>
          Ana sayfa
        </Button>
      </div>
    </main>
  )
}
