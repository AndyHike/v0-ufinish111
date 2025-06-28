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
    }
  }, [gtmId, consent])

  if (!consent || !gtmId) {
    return null
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`} strategy="afterInteractive" />
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
