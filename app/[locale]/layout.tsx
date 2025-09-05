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
      title: "DeviceHelp - DeviceHelp - Професійний ремонт мобільних телефонів у Празі",
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
    other: {
      "seznam-wmt": "kEPWnFjKJyWrp9OtNNXIlOe6oNf9vfv4",
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
  )
}
