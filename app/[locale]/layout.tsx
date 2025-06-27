import { NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getCurrentUser } from "@/lib/auth/session"
// ВИДАЛЕНО: Рядок, що імпортував неіснуючу функцію getMessages
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

// Ця частина з SEO залишається без змін, вона написана добре.
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params.locale
  if (!locales.includes(locale as any)) {
    notFound()
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://devicehelp.cz"
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
  // --- ПОЧАТОК ВАЖЛИВИХ ЗМІН ---
  let messages;
  try {
    // ЗМІНЕНО: Ми завантажуємо файл перекладу напряму, а не через функцію-посередника.
    // Шлях '../../messages/' означає: "вийди з папки [locale], вийди з папки app, і там знайди папку messages".
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
  // --- КІНЕЦЬ ВАЖЛИВИХ ЗМІН ---

  const user = await getCurrentUser()

  return (
    <html lang={locale}>
      {/* ВИДАЛЕНО: Секція <head> з компонентом <SeoHead>, бо вона конфліктувала з generateMetadata */}
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
