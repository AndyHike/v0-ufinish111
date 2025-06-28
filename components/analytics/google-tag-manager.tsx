"use client"

import { useEffect } from "react"
import Script from "next/script"
import { useCookieConsentContext } from "@/contexts/cookie-consent-context"

interface GoogleTagManagerProps {
  gtmId: string
}

export function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  const { consent } = useCookieConsentContext()

  useEffect(() => {
    if (consent.analytics && gtmId && typeof window !== "undefined") {
      // Push consent state to dataLayer
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: "consent_update",
        analytics_consent: consent.analytics ? "granted" : "denied",
        marketing_consent: consent.marketing ? "granted" : "denied",
      })
    }
  }, [consent.analytics, consent.marketing, gtmId])

  if (!consent.analytics || !gtmId) {
    return null
  }

  return (
    <>
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  )
}
