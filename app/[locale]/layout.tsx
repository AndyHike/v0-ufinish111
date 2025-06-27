import { NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getCurrentUser } from "@/lib/auth/session"
import { getMessages } from "@/lib/get-messages"
import { SeoHead } from "@/components/seo/SeoHead"
import { Inter } from "next/font/google"
import type { ReactNode } from "react"
import type { Metadata } from "next"

import { locales } from "@/i18n"

import "../globals.css"

const inter = Inter({ subsets: ["latin"] })

interface RootLayoutProps {
  children: ReactNode
  params: { locale: string }
}

// Generate metadata for each locale
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params.locale

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound()
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://devicehelp.cz"

  // Define titles and descriptions for each locale
  const seoData = {
    cs: {
      title: "DeviceHelp - Profesionální oprava mobilních telefonů v Praze",
      description:
        "Rychlá a kvalitní oprava mobilních telefonů v Praze. Výměna displeje, baterie, oprava po vodě. Záruka na všechny opravy. Kontaktujte nás ještě dnes!",
    },
    en: {
      title: "DeviceHelp - Professional Mobile Phone Repair in Prague",
      description:
        "Fast and quality mobile phone repair in Prague. Screen replacement, battery replacement, water damage repair. Warranty on all repairs. Contact us today!",
    },
    uk: {
      title: "DeviceHelp - Професійний ремонт мобільних телефонів у Празі",
      description:
        "Швидкий та якісний ремонт мобільних телефонів у Празі. Заміна екрану, батареї, ремонт після води. Гарантія на всі ремонти. Зв'яжіться з нами сьогодні!",
    },
  }

  const currentSeo = seoData[locale as keyof typeof seoData] || seoData.cs

  // Generate language alternates
  const alternates = {
    canonical: `${baseUrl}/${locale}`,
    languages: {
      cs: `${baseUrl}/cs`,
      en: `${baseUrl}/en`,
      uk: `${baseUrl}/uk`,
      "x-default": `${baseUrl}/cs`,
    },
  }

  return {
    title: currentSeo.title,
    description: currentSeo.description,
    metadataBase: new URL(baseUrl),
    alternates: alternates,
    openGraph: {
      title: currentSeo.title,
      description: currentSeo.description,
      url: `${baseUrl}/${locale}`,
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

export default async function LocaleLayout({ children, params: { locale } }: RootLayoutProps) {
  let messages
  try {
    messages = await getMessages(locale)
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    notFound()
  }

  const user = await getCurrentUser()

  return (
    <html lang={locale}>
      <head>
        <SeoHead title="Device Help CZ" description="Profesionální servis pro vaše zařízení v Praze." />
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Header user={user} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
