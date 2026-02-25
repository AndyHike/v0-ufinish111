"use client"

import { useEffect, useState } from "react"
import Script from "next/script"

interface GoogleTagManagerProps {
  gtmId: string
}

declare global {
  interface Window {
    dataLayer: any[]
    gtag?: any
  }
}

export function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (!gtmId || typeof window === "undefined") {
      console.log("[v0] GTM not loaded - gtmId:", gtmId)
      return
    }

    console.log("[v0] GTM initializing with ID:", gtmId)

    // Перевіряємо попередню згоду при завантаженні сторінки
    const storedConsent = localStorage.getItem("cookie-consent")
    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent)
        if (parsed.consent) {
          // Якщо є попередня згода, одразу оновлюємо статуси
          const consentStatus = {
            ad_storage: parsed.consent.marketing ? "granted" : "denied",
            ad_user_data: parsed.consent.marketing ? "granted" : "denied",
            ad_personalization: parsed.consent.marketing ? "granted" : "denied",
            analytics_storage: parsed.consent.analytics ? "granted" : "denied",
          }

          console.log("[v0] GTM consent update:", consentStatus)

          if (window.gtag) {
            window.gtag("consent", "update", consentStatus)
          }
        }
      } catch (error) {
        console.error("[v0] Error parsing stored consent for GTM:", error)
      }
    }
  }, [gtmId])

  if (!mounted || !gtmId) {
    return null
  }

  return (
    <>
      <Script
        id="gtm-script"
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
