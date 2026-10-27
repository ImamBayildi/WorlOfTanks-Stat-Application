import Link from "next/link"
import { Crosshair } from "lucide-react"
import { PlayerSearch } from "@/components/player-search"
import { SiteNav } from "@/components/site-nav"
import { LanguageSwitcher } from "@/components/language-switcher"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 lg:flex-nowrap">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Crosshair className="size-4" aria-hidden="true" />
          </span>
          Wotrate
        </Link>
        <SiteNav className="min-w-0 overflow-x-auto lg:order-last" />
        <LanguageSwitcher className="ml-auto shrink-0 lg:order-last lg:ml-0" />
        <PlayerSearch className="order-last basis-full lg:order-none lg:ml-auto lg:max-w-xs lg:basis-auto" />
      </div>
    </header>
  )
}
