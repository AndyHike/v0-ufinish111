import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getCurrentUser } from "@/lib/auth/session"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/components/providers/session-provider"
import { InfoBanner } from "@/components/info-banner"
import { DevEmailNotification } from "@/components/dev-email-notification"
import { DynamicFavicon } from "@/components/dynamic-favicon"
import { locales } from "@/i18n"
import "../globals.css"

const inter = Inter({ subsets: ["latin"] })

const URL = process.env.NEXT_PUBLIC_APP_URL || "https://devicehelp.cz"

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const messages = await getMessages(locale)

  const title =
    locale === "cs"
      ? "DeviceHelp.cz - Profesionální oprava mobilních telefonů"
      : locale === "uk"
        ? "DeviceHelp.cz - Професійний ремонт мобільних телефонів"
        : "DeviceHelp.cz - Professional Mobile Phone Repair"

  const description =
    locale === "cs"
      ? "Rychlá a kvalitní oprava mobilních telefonů s garancí. Specializujeme se na výměnu displejů, baterií a další opravy všech značek telefonů."
      : locale === "uk"
        ? "Швидкий та якісний ремонт мобільних телефонів з гарантією. Спеціалізуємося на заміні екранів, батарей та інших ремонтах всіх брендів телефонів."
        : "Fast and quality mobile phone repair with warranty. We specialize in screen replacement, battery replacement and other repairs for all phone brands."

  const alternates: Record<string, string> = {}
  locales.forEach((loc) => {
    alternates[loc] = `${URL}/${loc}`
  })

  return {
    title,
    description,
    metadataBase: new URL(URL),
    alternates: {
      canonical: `${URL}/${locale}`,
      languages: alternates,
    },
    openGraph: {
      title,
      description,
      url: `${URL}/${locale}`,
      siteName: "DeviceHelp.cz",
      locale: locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
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
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound()

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages(locale)

  const user = await getCurrentUser()

  // JSON-LD Structured Data
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DeviceHelp",
    url: URL,
    logo: `${URL}/placeholder-logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+420-XXX-XXX-XXX",
      contactType: "customer service",
      availableLanguage: ["Czech", "English", "Ukrainian"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "CZ",
      addressLocality: "Praha",
    },
    sameAs: [
      // Add social media URLs here when available
    ],
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DeviceHelp.cz",
    url: URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${URL}/${locale}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]),
          }}
        />
        <DynamicFavicon />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SessionProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <InfoBanner />
              <DevEmailNotification />
              <div className="flex min-h-screen flex-col">
                <Header user={user} />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster />
            </NextIntlClientProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
