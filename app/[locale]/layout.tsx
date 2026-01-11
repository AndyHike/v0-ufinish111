import type React from "react"
import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"
import { Inter } from "next/font/google"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getMessages } from "@/lib/get-messages"
import { CookieConsentProvider } from "@/contexts/cookie-consent-context"
import { CookieBanner } from "@/components/cookie-banner"
import { AnalyticsProvider } from "@/components/analytics/analytics-provider"
import { Suspense } from "react"
import { SessionProvider } from "@/components/providers/session-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { DynamicFavicon } from "@/components/dynamic-favicon"
import { Analytics } from "@vercel/analytics/react"
import "@/app/globals.css"

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
  adjustFontFallback: true,
  fallback: ["system-ui", "arial"],
})

export async function generateStaticParams() {
  return [{ locale: "cs" }, { locale: "en" }, { locale: "uk" }]
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const baseUrl = "https://devicehelp.cz"
  const canonicalUrl = `${baseUrl}/${locale}`

  const seoData = {
    cs: {
      title: "DeviceHelp - Profesionální oprava mobilních telefonů v Praze",
      description: "Rychlá a kvalitní oprava mobilních telefonů v Praze. Záruka na všechny opravy.",
    },
    en: {
      title: "DeviceHelp - Professional Mobile Phone Repair in Prague",
      description: "Fast and quality mobile phone repair in Prague. Warranty on all repairs.",
    },
    uk: {
      title: "DeviceHelp - DeviceHelp - Profesійнý ремонт мобільних телефонів у Празі",
      description: "Швидкий та якісний ремонт мобільних телефонів у Празі. Гарантія на всі ремонти.",
    },
  }

  const currentSeo = seoData[locale as keyof typeof seoData] || seoData.cs

  return {
    title: currentSeo.title,
    description: currentSeo.description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        cs: `${baseUrl}/cs`,
        en: `${baseUrl}/en`,
        uk: `${baseUrl}/uk`,
        "x-default": `${baseUrl}/cs`,
      },
    },
    openGraph: {
      title: currentSeo.title,
      description: currentSeo.description,
      url: canonicalUrl,
      siteName: "DeviceHelp",
      locale: locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: currentSeo.title,
      description: currentSeo.description,
    },
    icons: {
      icon: [
        {
          url: "https://xnwoqomipsesacphoczp.supabase.co/storage/v1/object/public/site-assets/favicon/1750418444610-hgnxmfio3rv.PNG",
          type: "image/png",
        },
      ],
      apple: [
        {
          url: "https://xnwoqomipsesacphoczp.supabase.co/storage/v1/object/public/site-assets/favicon/1750418444610-hgnxmfio3rv.PNG",
          type: "image/png",
        },
      ],
    },
  }
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages(locale).catch((error) => {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    return null
  })

  if (!messages) {
    notFound()
  }

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://xnwoqomipsesacphoczp.supabase.co" />
        <link rel="dns-prefetch" href="https://devicehelp.cz" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="seznam-wmt" content="5VWPSjprwBjXXCI2HRoOVfvKcmdPB1Om" />
        <link rel="preload" href="/focused-phone-fix.webp" as="image" type="image/webp" fetchPriority="high" />

        <style
          dangerouslySetInnerHTML={{
            __html: `
            *{box-sizing:border-box}
            body{font-family:var(--font-inter),system-ui,sans-serif;margin:0;padding:0;-webkit-font-smoothing:antialiased;text-rendering:optimizeSpeed;line-height:1.5}
            .hero-section{background:#fff;padding:1.5rem 0;min-height:350px;contain:layout style paint}
            .hero-title{font-size:1.75rem;font-weight:600;line-height:1.2;margin-bottom:0.75rem;color:#111827}
            .hero-subtitle{color:#6b7280;font-size:1rem;margin-bottom:1.5rem;line-height:1.5;font-weight:400}
            .hero-image{width:100%;height:250px;object-fit:cover;border-radius:0.75rem;transform:translateZ(0);content-visibility:auto}
            .container{max-width:1200px;margin:0 auto;padding:0 1rem}
            .btn-primary{background:#2563eb;color:#fff;padding:0.75rem 1.5rem;border-radius:0.5rem;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;border:none;cursor:pointer;transition:background-color 0.15s ease}
            .btn-primary:hover{background:#1d4ed8}
            @media(min-width:768px){.hero-section{padding:4rem 0}.hero-title{font-size:2.5rem}.hero-image{height:300px}}
            @media(min-width:1024px){.hero-title{font-size:3rem}.hero-image{height:350px}}
          `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <SessionProvider>
              <CookieConsentProvider>
                <DynamicFavicon />
                <div className="flex min-h-screen flex-col">
                  <Suspense fallback={<HeaderSkeleton />}>
                    <Header />
                  </Suspense>
                  <main className="flex-1">{children}</main>
                  <Footer />
                  <CookieBanner />
                  <Suspense fallback={null}>
                    <AnalyticsProvider />
                  </Suspense>
                </div>
                <Toaster />
                <Analytics />
              </CookieConsentProvider>
            </SessionProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-2 md:px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-muted animate-pulse" />
          <div className="h-5 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="h-10 w-full rounded bg-muted animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-5 w-16 rounded bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
    </header>
  )
}
