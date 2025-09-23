import type React from "react"
import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getCurrentUser } from "@/lib/auth/session"
import { getMessages } from "@/lib/get-messages"
import { CookieConsentProvider } from "@/contexts/cookie-consent-context"
import { CookieBanner } from "@/components/cookie-banner"
import { AnalyticsProvider } from "@/components/analytics/analytics-provider"
import { Suspense } from "react"
import { SessionProvider } from "@/components/providers/session-provider"
import { PerformanceProvider } from "@/components/performance-provider"
import { PerformanceDebug } from "@/components/performance-debug"
import { ServiceWorkerProvider } from "@/components/service-worker-provider"
import "@/app/globals.css"

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
  }
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  let messages
  try {
    messages = await getMessages(locale)
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    notFound()
  }

  const user = await getCurrentUser()

  return (
    <>
      <head>
        <meta name="seznam-wmt" content="5VWPSjprwBjXXCI2HRoOVfvKcmdPB1Om" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap&subset=latin"
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap&subset=latin"
          />
        </noscript>

        <link rel="preload" href="/focused-phone-fix.webp" as="image" type="image/webp" media="(min-width: 768px)" />
        <link
          rel="preload"
          href="/focused-phone-fix-mobile.webp"
          as="image"
          type="image/webp"
          media="(max-width: 767px)"
        />

        <style
          dangerouslySetInnerHTML={{
            __html: `
            body{font-family:'Inter',system-ui,sans-serif;margin:0;padding:0;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%}
            .hero-section{background:#fff;padding:1rem 0;min-height:300px;contain:layout style paint}
            .hero-title{font-size:1.5rem;font-weight:700;line-height:1.2;margin-bottom:0.75rem;color:#111827}
            .hero-subtitle{color:#6b7280;font-size:1rem;margin-bottom:1.5rem;line-height:1.5;font-weight:400}
            .hero-image{width:100%;height:200px;object-fit:cover;border-radius:0.5rem}
            .container{max-width:1200px;margin:0 auto;padding:0 1rem}
            .btn-primary{background:#2563eb;color:#fff;padding:0.75rem 1.5rem;border-radius:0.5rem;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;border:none;cursor:pointer;transition:background-color 0.2s;touch-action:manipulation}
            .btn-primary:hover{background:#1d4ed8}
            .loading-skeleton{background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:loading 1.5s infinite}
            @keyframes loading{0%{background-position:200% 0}100%{background-position:-200% 0}}
            @media(max-width:767px){body{-webkit-overflow-scrolling:touch;overscroll-behavior:contain}}
            @media(min-width:768px){.hero-section{padding:3rem 0}.hero-title{font-size:2.5rem}.hero-image{height:300px}}
            @media(min-width:1024px){.hero-title{font-size:3rem}.hero-section{padding:4rem 0}}
            @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important}}
          `,
          }}
        />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <SessionProvider>
          <CookieConsentProvider>
            <ServiceWorkerProvider>
              <PerformanceProvider>
                <div className="flex min-h-screen flex-col">
                  <Header user={user} />
                  <main className="flex-1">{children}</main>
                  <Footer />
                  <CookieBanner />
                  <Suspense fallback={null}>
                    <AnalyticsProvider />
                  </Suspense>
                  <PerformanceDebug />
                </div>
              </PerformanceProvider>
            </ServiceWorkerProvider>
          </CookieConsentProvider>
        </SessionProvider>
      </NextIntlClientProvider>
    </>
  )
}
