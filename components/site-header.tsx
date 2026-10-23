import Link from "next/link"
import { Crosshair } from "lucide-react"
import { PlayerSearch } from "@/components/player-search"
import { SiteNav } from "@/components/site-nav"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 md:flex-nowrap">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Crosshair className="size-4" aria-hidden="true" />
          </span>
          TankStat
        </Link>
        <SiteNav className="ml-auto overflow-x-auto md:order-last md:ml-0" />
        <PlayerSearch className="order-last basis-full md:order-none md:ml-auto md:max-w-sm md:basis-auto" />
      </div>
    </header>
  )
}
