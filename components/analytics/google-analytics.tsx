"use client"

import { useEffect } from "react"
import Script from "next/script"
import { useCookieConsentContext } from "@/contexts/cookie-consent-context"

interface GoogleAnalyticsProps {
  gaId: string
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  const { consent } = useCookieConsentContext()

  useEffect(() => {
    if (consent.analytics && gaId && typeof window !== "undefined") {
      // Configure Google Analytics
      window.gtag("config", gaId, {
        page_title: document.title,
        page_location: window.location.href,
      })
    }
  }, [consent.analytics, gaId])

  if (!consent.analytics || !gaId) {
    return null
  }

  return (
    <>
      <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `,
        }}
      />
    </>
  )
}
