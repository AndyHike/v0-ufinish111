import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getCurrentUser } from "@/lib/auth/session"
import { getMessages } from "@/lib/get-messages"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { NextAuthProvider } from "@/components/providers/session-provider"
import { DynamicFavicon } from "@/components/dynamic-favicon"
import { locales } from "@/i18n"
import "../globals.css"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Metadata" })
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://devicehelp.cz"

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: t("title"),
      template: `%s | ${t("title")}`,
    },
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        "cs-CZ": "/cs",
        "en-US": "/en",
        "uk-UA": "/uk",
        "x-default": "/cs",
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
  let messages
  try {
    messages = await getMessages(locale)
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    notFound()
  }

  const user = await getCurrentUser()

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DeviceHelp",
    url: "https://devicehelp.cz/",
    logo: "https://devicehelp.cz/placeholder-logo.png", // Replace with your actual logo URL
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DeviceHelp",
    url: "https://devicehelp.cz/",
    potentialAction: {
      "@type": "SearchAction",
      target: `${process.env.NEXT_PUBLIC_APP_URL || "https://devicehelp.cz"}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <html lang={locale}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      </head>
      <body className={inter.className}>
        <NextAuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <DynamicFavicon />
              <div className="flex min-h-screen flex-col">
                <Header user={user} />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster />
            </NextIntlClientProvider>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
