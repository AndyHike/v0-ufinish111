import type React from "react"
import { cn } from "@/lib/utils"
import { Mona_Sans as FontSans } from "next/font/google"

import { NavigationProgress } from "@/components/navigation-progress"
import { NextIntlClientProvider } from "next-intl"
import { SessionProvider } from "next-auth/react"
import { CookieConsentProvider } from "@/components/cookie-consent-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CookieBanner } from "@/components/cookie-banner"
import { AnalyticsProvider } from "@/components/analytics"
import { Suspense } from "react"
import { getUser } from "@/lib/payload-utils"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

interface RootLayoutProps {
  children: React.ReactNode
  params: {
    locale: string
  }
}

export default async function RootLayout({ children, params: { locale } }: RootLayoutProps) {
  let messages
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default
  } catch (error) {
    // If there is an error, that means the translation file is missing for the
    // selected locale, in that case we'll just fallback to english
    messages = (await import(`../../../messages/en.json`)).default
  }

  const user = await getUser()

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProvider>
            <CookieConsentProvider>
              <NavigationProgress />
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
      </body>
    </html>
  )
}
