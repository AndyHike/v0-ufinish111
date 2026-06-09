import type React from "react"
import Script from "next/script"
import { NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"
import { Inter } from "next/font/google"
import { Suspense } from "react"

import { CookieBanner } from "@/components/cookie-banner"
import { DynamicFavicon } from "@/components/dynamic-favicon"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { PromotionalBanner } from "@/components/promotional-banner"
import { SessionProvider } from "@/components/providers/session-provider"
import { ShopCartProvider } from "@/components/shop/shop-cart-provider"
import { ShopFooter } from "@/components/shop/shop-footer"
import { ShopHeader } from "@/components/shop/shop-header"
import { getShopCategoryTree } from "@/lib/shop/data"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { CookieConsentProvider } from "@/contexts/cookie-consent-context"
import { generateLocalBusinessSchema } from "@/lib/structured-data"
import { getMessages } from "@/lib/get-messages"
import { mainSiteUrl } from "@/lib/site-config"
import type { ShopLocale } from "@/lib/shop/types"
import { GlobalDataProvider } from "@/providers/global-data-provider"

export type SiteLayoutVariant = "default" | "b2b" | "shop"

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
  adjustFontFallback: true,
  fallback: ["system-ui", "arial"],
})

interface SiteLocaleLayoutProps {
  children: React.ReactNode
  locale: string
  variant: SiteLayoutVariant
  showPromotionalBanner?: boolean
  includeLocalBusinessSchema?: boolean
}

export async function SiteLocaleLayout({
  children,
  locale,
  variant,
  showPromotionalBanner = variant === "default",
  includeLocalBusinessSchema = variant === "default",
}: SiteLocaleLayoutProps) {
  const messages = await getMessages(locale).catch((error) => {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    return null
  })

  if (!messages) {
    notFound()
  }

  const localBusinessSchema = includeLocalBusinessSchema ? generateLocalBusinessSchema(locale) : null
  // Real category tree from the admin API (shop only); empty for other variants.
  const shopCategoryTree = variant === "shop" ? await getShopCategoryTree() : []

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <Script
          id="google-consent-mode"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
                'wait_for_update': 500
              });
              gtag('set', {'url_passthrough': true});
            `,
          }}
        />

        <Script
          id="google-tag-manager"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-P8H3C553');`,
          }}
        />

        {localBusinessSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
          />
        )}

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://xnwoqomipsesacphoczp.supabase.co" />
        <link rel="dns-prefetch" href="https://devicehelp.cz" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="seznam-wmt" content="5VWPSjprwBjXXCI2HRoOVfvKcmdPB1Om" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            *{box-sizing:border-box}
            body{font-family:var(--font-inter),system-ui,sans-serif;margin:0;padding:0;-webkit-font-smoothing:antialiased;text-rendering:optimizeSpeed;line-height:1.5}
            .hero-section{background:#fff;padding:1.5rem 0;min-height:350px;contain:layout style paint}
            .hero-title{font-size:1.75rem;font-weight:600;line-height:1.2;margin-bottom:0.75rem}
            .hero-subtitle{color:#6b7280;font-size:1rem;margin-bottom:1.5rem;line-height:1.5;font-weight:400}
            .hero-image{width:100%;height:250px;object-fit:cover;border-radius:0.75rem;transform:translateZ(0);content-visibility:auto}
            .container{max-width:1200px;margin:0 auto;padding:0 1rem}
            .btn-primary{background:#2563eb;color:#fff;padding:0.75rem 1.5rem;border-radius:0.5rem;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;border:none;cursor:pointer;transition:background-color 0.15s ease}
            .btn-primary:hover{background:#1d4ed8}
            @media(min-width:768px){.hero-section{padding:4rem 0}.hero-title{font-size:2.5rem}.hero-image{height:300px}}
            @media(min-width:1024px){.hero-title{font-size:3rem}.hero-image{height:350px}}
          `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <SessionProvider>
              <CookieConsentProvider>
                <GlobalDataProvider>
                  <DynamicFavicon />
                  <div className="flex min-h-screen flex-col">
                    {showPromotionalBanner && (
                      <Suspense fallback={null}>
                        <PromotionalBanner locale={locale} />
                      </Suspense>
                    )}
                    {variant === "shop" ? (
                      <ShopCartProvider>
                        <ShopHeader locale={locale as ShopLocale} categoryTree={shopCategoryTree} />
                        <main className="flex-1">{children}</main>
                        <ShopFooter locale={locale as ShopLocale} />
                      </ShopCartProvider>
                    ) : (
                      <>
                        <Header variant={variant} mainDomainBaseUrl={mainSiteUrl} localeOverride={locale} />
                        <main className="flex-1">{children}</main>
                        <Footer />
                      </>
                    )}
                    {/* Cookie consent is managed only on the main domain; the
                        shop/b2b subdomains are separate origins and link their
                        legal/cookie pages back to the main site. */}
                    {variant === "default" && <CookieBanner />}
                  </div>
                  <Toaster />
                </GlobalDataProvider>
              </CookieConsentProvider>
            </SessionProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
