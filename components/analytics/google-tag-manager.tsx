"use client"

import { useEffect } from "react"
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
  useEffect(() => {
    if (!gtmId || typeof window === "undefined") return

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

          if (window.gtag) {
            window.gtag("consent", "update", consentStatus)
          }
        }
      } catch (error) {
        console.error("Error parsing stored consent for GTM:", error)
      }
    }
  }, [gtmId])

  if (!gtmId) {
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
