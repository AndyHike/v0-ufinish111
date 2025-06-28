"use client"

import { useEffect } from "react"
import Script from "next/script"

interface GoogleTagManagerProps {
  gtmId: string
  consent: boolean
}

declare global {
  interface Window {
    dataLayer: any[]
  }
}

export function GoogleTagManager({ gtmId, consent }: GoogleTagManagerProps) {
  useEffect(() => {
    if (consent && gtmId && typeof window !== "undefined") {
      // Ініціалізуємо dataLayer для GTM
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        "gtm.start": new Date().getTime(),
        event: "gtm.js",
      })

      console.log("Google Tag Manager initialized with ID:", gtmId)
    }
  }, [gtmId, consent])

  if (!consent || !gtmId) {
    console.log("GTM not loaded - consent:", consent, "gtmId:", gtmId)
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`}
        strategy="afterInteractive"
        onLoad={() => console.log("GTM script loaded successfully")}
        onError={() => console.error("Failed to load GTM script")}
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
