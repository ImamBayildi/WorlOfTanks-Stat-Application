import { Analytics } from "@vercel/analytics/next"
import Link from "next/link"
import { ADSENSE_PUBLISHER_ID } from "@/lib/adsense"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SiteHeader } from "@/components/site-header"
import { I18nProvider } from "@/components/i18n-provider"
import { FeedbackWidget } from "@/components/feedback-widget"
import { getI18n } from "@/lib/i18n/server"
import "./globals.css"

const geist = Geist({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-geist-mono" })

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n()
  return {
    metadataBase: new URL("https://wotrate.com"),
    title: { default: t.meta.title, template: "%s · Wotrate" },
    description: t.meta.description,
    applicationName: "Wotrate",
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "Wotrate",
      title: t.meta.title,
      description: t.meta.description,
      url: "/",
      locale: { tr: "tr_TR", en: "en_US", ru: "ru_RU" }[locale],
    },
    icons: {
      icon: [
        { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
        { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: "/apple-icon.png",
    },
  }
}

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#14161b",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { locale, t } = await getI18n()
  return (
    <html lang={locale} className={`dark ${geist.variable} ${geistMono.variable}`}>
      <head>
        {process.env.NODE_ENV === "production" && <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`} crossOrigin="anonymous" />}
      </head>
      <body className="min-h-dvh antialiased">
        <I18nProvider locale={locale}>
          <TooltipProvider>
            <SiteHeader />
            {children}
            <footer className="mx-auto w-full max-w-6xl px-4 py-10 text-xs text-muted-foreground">
              <p>{t.footer}</p>
              <Link href="/privacy" className="mt-3 inline-block underline underline-offset-4">{{ tr: "Gizlilik ve çerezler", en: "Privacy and cookies", ru: "Конфиденциальность и cookie" }[locale]}</Link>
            </footer>
            <FeedbackWidget />
          </TooltipProvider>
        </I18nProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
