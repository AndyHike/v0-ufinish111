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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        <link rel="preload" href="/focused-phone-fix.webp" as="image" type="image/webp" fetchPriority="high" />

        <style
          dangerouslySetInnerHTML={{
            __html: `
            @font-face{font-family:'Inter';font-style:normal;font-weight:400 700;font-display:swap;src:url(https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
            body{font-family:'Inter',system-ui,sans-serif;margin:0;padding:0;-webkit-font-smoothing:antialiased;text-rendering:optimizeSpeed}
            .hero-section{background:#fff;padding:1.5rem 0;min-height:350px;contain:layout style paint}
            .hero-title{font-size:1.75rem;font-weight:600;line-height:1.2;margin-bottom:0.75rem;color:#111827}
            .hero-subtitle{color:#6b7280;font-size:1rem;margin-bottom:1.5rem;line-height:1.5;font-weight:400}
            .hero-image{width:100%;height:250px;object-fit:cover;border-radius:0.75rem;transform:translateZ(0)}
            .container{max-width:1200px;margin:0 auto;padding:0 1rem}
            .btn-primary{background:#2563eb;color:#fff;padding:0.75rem 1.5rem;border-radius:0.5rem;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;border:none;cursor:pointer;transition:background-color 0.15s ease}
            .btn-primary:hover{background:#1d4ed8}
            @media(min-width:768px){.hero-section{padding:4rem 0}.hero-title{font-size:2.5rem}.hero-image{height:300px}}
            @media(min-width:1024px){.hero-title{font-size:3rem}.hero-image{height:350px}}
          `,
          }}
        />
      </head>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <SessionProvider>
          <CookieConsentProvider>
            <div className="flex min-h-screen flex-col">
              <Header user={user} />
              <main className="flex-1">{children}</main>
              <Footer />
              <CookieBanner />
              <Suspense fallback={null}>
                <AnalyticsProvider />
              </Suspense>
            </div>
          </CookieConsentProvider>
        </SessionProvider>
      </NextIntlClientProvider>
    </>
  )
}
