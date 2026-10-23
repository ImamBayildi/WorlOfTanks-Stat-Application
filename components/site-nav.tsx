"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/", label: "Oyuncu Ara", match: (p: string) => p === "/" || p.startsWith("/player") },
  { href: "/reytingler", label: "Oyuncu Reytingleri", match: (p: string) => p.startsWith("/reytingler") },
]

export function SiteNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const donateActive = pathname.startsWith("/donate")
  return (
    <nav aria-label="Ana menü" className={cn("flex items-center gap-1 text-sm", className)}>
      {LINKS.map((l) => {
        const active = l.match(pathname)
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-md px-2.5 py-1.5 transition-colors",
              active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        )
      })}
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
        Donate
      </Link>
    </nav>
  )
}
