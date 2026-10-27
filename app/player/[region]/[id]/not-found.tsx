import Link from "next/link"
import { getI18n } from "@/lib/i18n/server"

export default async function NotFound() {
  const { t } = await getI18n()
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-start gap-3 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t.player.notFoundTitle}</h1>
      <p className="text-muted-foreground">{t.player.notFoundText}</p>
      <Link href="/" className="text-primary underline-offset-4 hover:underline">
        {t.player.newSearch}
      </Link>
    </main>
  )
}
