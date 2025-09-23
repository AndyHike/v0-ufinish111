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
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        <link rel="preload" href="/focused-phone-fix.webp" as="image" type="image/webp" />

        <style
          dangerouslySetInnerHTML={{
            __html: `
            .hero-section{background:#fff;padding:2rem 0}
            .hero-title{font-size:2rem;font-weight:700;line-height:1.2;margin-bottom:1rem}
            .hero-subtitle{color:#6b7280;font-size:1.125rem;margin-bottom:2rem}
            .hero-image{width:100%;height:300px;object-fit:cover;border-radius:0.75rem}
            @media(min-width:768px){.hero-section{padding:6rem 0}.hero-title{font-size:3rem}.hero-image{height:350px}}
            .btn-primary{background:linear-gradient(to right,#2563eb,#4f46e5);color:#fff;padding:0.75rem 1.5rem;border-radius:0.5rem;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}
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
