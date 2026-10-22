import Link from "next/link"
import { Crosshair } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Crosshair className="size-4" aria-hidden="true" />
          </span>
          TankStat
        </Link>
        <nav aria-label="Ana menü" className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Oyuncu Ara
          </Link>
          <Link href="/#reytingler" className="hidden transition-colors hover:text-foreground sm:inline">
            Reytingler
          </Link>
        </nav>
      </div>
    </header>
  )
}
