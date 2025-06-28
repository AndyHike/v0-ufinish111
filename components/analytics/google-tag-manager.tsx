"use client"

import { useEffect } from "react"
import Script from "next/script"

interface GoogleTagManagerProps {
  gtmId?: string
}

export function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  useEffect(() => {
    if (gtmId && typeof window !== "undefined") {
      // Disable debug logging for GTM
      const originalConsoleLog = console.log
      const originalConsoleInfo = console.info

      // Filter out ECOMMERCE and processor logs
      console.log = (...args) => {
        const message = args.join(" ")
        if (!message.includes("[ECOMMERCE]") && !message.includes("processor.js")) {
          originalConsoleLog.apply(console, args)
        }
      }

      console.info = (...args) => {
        const message = args.join(" ")
        if (!message.includes("[ECOMMERCE]") && !message.includes("processor.js")) {
          originalConsoleInfo.apply(console, args)
        }
      }

      // Initialize GTM dataLayer
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        "gtm.start": new Date().getTime(),
        event: "gtm.js",
      })
    }
  }, [gtmId])

  if (!gtmId) return null

  return (
    <>
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>
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

declare global {
  interface Window {
    dataLayer: any[]
  }
}
