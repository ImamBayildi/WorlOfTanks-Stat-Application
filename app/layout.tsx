import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SiteHeader } from "@/components/site-header"
import "./globals.css"

const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: {
    default: "TankStat — World of Tanks Oyuncu İstatistikleri",
    template: "%s · TankStat",
  },
  description:
    "World of Tanks oyuncu istatistikleri: nick ile arayın, WN8, WNX ve WoT Kişisel Reytingi ile oyuncuları ve tankları karşılaştırın.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#14161b",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className={`dark ${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh antialiased">
        <TooltipProvider>
          <SiteHeader />
          {children}
          <footer className="mx-auto w-full max-w-6xl px-4 py-10 text-xs text-muted-foreground">
            Veriler Wargaming Public API üzerinden alınır. WN8 beklenen değerleri XVM, WNX beklenen değerleri
            tomato.gg kaynaklıdır. Bu site Wargaming ile bağlantılı değildir.
          </footer>
        </TooltipProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
