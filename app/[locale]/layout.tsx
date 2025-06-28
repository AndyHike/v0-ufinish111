import type React from "react"
import { Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { CookieConsentProvider } from "@/contexts/cookie-consent-context"
import { CookieBanner } from "@/components/cookie-banner"
import { SessionProvider } from "@/components/providers/session-provider"
import { AnalyticsProvider } from "@/components/analytics/analytics-provider"
import { DynamicFavicon } from "@/components/dynamic-favicon"
import Script from "next/script"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export default async function LocaleLayout({
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
        {/* Console filter script - load first */}
        <Script id="console-filter" strategy="beforeInteractive">
          {`
            (function() {
              if (typeof window === 'undefined') return;
              
              const originalConsoleLog = console.log;
              const originalConsoleInfo = console.info;
              const originalConsoleWarn = console.warn;
              
              const filterPatterns = [
                '[ECOMMERCE]',
                'processor.js',
                'Runtime storage save',
                'Re-init config for url'
              ];
              
              const shouldFilter = (message) => {
                return filterPatterns.some(pattern => message.includes(pattern));
              };
              
              console.log = function(...args) {
                const message = args.join(' ');
                if (!shouldFilter(message)) {
                  originalConsoleLog.apply(console, args);
                }
              };
              
              console.info = function(...args) {
                const message = args.join(' ');
                if (!shouldFilter(message)) {
                  originalConsoleInfo.apply(console, args);
                }
              };
              
              console.warn = function(...args) {
                const message = args.join(' ');
                if (!shouldFilter(message)) {
                  originalConsoleWarn.apply(console, args);
                }
              };
            })();
          `}
        </Script>

        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <SessionProvider>
              <CookieConsentProvider>
                <AnalyticsProvider>
                  <Suspense fallback={null}>
                    <main className="flex-1">{children}</main>
                  </Suspense>
                  <Suspense fallback={null}>
                    <CookieBanner />
                  </Suspense>
                  <Toaster />
                </AnalyticsProvider>
              </CookieConsentProvider>
            </SessionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
