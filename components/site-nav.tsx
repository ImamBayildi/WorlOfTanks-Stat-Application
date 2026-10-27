"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"

export function SiteNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const { t } = useI18n()
  const donateActive = pathname.startsWith("/donate")

  const links = [
    { href: "/", label: t.nav.search, active: pathname === "/" || pathname.startsWith("/player") },
    { href: "/reytingler", label: t.nav.ratings, active: pathname.startsWith("/reytingler") },
    { href: "/spotmeter", label: t.nav.spotmeter, active: pathname.startsWith("/spotmeter") },
  ]

  return (
    <nav aria-label={t.nav.menu} className={cn("flex items-center gap-1 text-sm", className)}>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.active ? "page" : undefined}
          className={cn(
            "whitespace-nowrap rounded-md px-2.5 py-1.5 transition-colors",
            l.active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l.label}
        </Link>
      ))}
      <Link
        href="/donate"
        aria-current={donateActive ? "page" : undefined}
        className={cn(
          "ml-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1.5 transition-colors",
          donateActive
            ? "border-primary/60 bg-primary/15 text-primary"
            : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary",
        )}
      >
        <Heart className="size-3.5" aria-hidden="true" />
        {t.nav.donate}
      </Link>
    </nav>
  )
}
