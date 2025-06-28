import type React from "react"
import { Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { InfoBanner } from "@/components/info-banner"
import { CookieBanner } from "@/components/cookie-banner"
import { CookieConsentProvider } from "@/contexts/cookie-consent-context"
import { SessionProvider } from "@/components/providers/session-provider"
import { AnalyticsProvider } from "@/components/analytics/analytics-provider"
import { ConsoleBlocker } from "@/components/console-blocker"
import { DynamicFavicon } from "@/components/dynamic-favicon"
import { AdminAnalyticsBlocker } from "@/components/analytics/admin-analytics-blocker"
import { Suspense } from "react"
import "@/app/globals.css"

const inter = Inter({ subsets: ["latin"] })

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <DynamicFavicon />
      </head>
      <body className={inter.className}>
        <ConsoleBlocker />
        <AdminAnalyticsBlocker />
        <Suspense fallback="Loading...">
          <SessionProvider>
            <NextIntlClientProvider messages={messages}>
              <CookieConsentProvider>
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                  <AnalyticsProvider />
                  <div className="min-h-screen flex flex-col">
                    <InfoBanner />
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                  <Toaster />
                  <CookieBanner />
                </ThemeProvider>
              </CookieConsentProvider>
            </NextIntlClientProvider>
          </SessionProvider>
        </Suspense>
      </body>
    </html>
  )
}
