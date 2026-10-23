import Link from "next/link"
import { Crosshair } from "lucide-react"
import { PlayerSearch } from "@/components/player-search"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:flex-nowrap">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Crosshair className="size-4" aria-hidden="true" />
          </span>
          TankStat
        </Link>
        <nav
          aria-label="Ana menü"
          className="ml-auto flex items-center gap-5 text-sm text-muted-foreground sm:order-last sm:ml-0"
        >
          <Link href="/#reytingler" className="transition-colors hover:text-foreground">
            Reytingler
          </Link>
        </nav>
        <PlayerSearch className="order-last basis-full sm:order-none sm:ml-auto sm:max-w-md sm:basis-auto" />
      </div>
    </header>
  )
}
