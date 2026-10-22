import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-start gap-3 px-4 py-16">
      <h1 className="text-2xl font-semibold">Oyuncu bulunamadı</h1>
      <p className="text-muted-foreground">Bu hesap bu sunucuda mevcut değil.</p>
      <Link href="/" className="text-primary underline-offset-4 hover:underline">
        Yeni arama yap
      </Link>
    </main>
  )
}
