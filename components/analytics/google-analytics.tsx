"use client"

import { useEffect } from "react"
import Script from "next/script"

interface GoogleAnalyticsProps {
  gaId: string
  consent: boolean
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export function GoogleAnalytics({ gaId, consent }: GoogleAnalyticsProps) {
  useEffect(() => {
    if (consent && gaId) {
      console.log(`Google Analytics initialized with ID: ${gaId}`)

      // Ініціалізуємо dataLayer якщо його немає
      if (typeof window !== "undefined") {
        window.dataLayer = window.dataLayer || []
        window.gtag = function gtag() {
          window.dataLayer.push(arguments)
        }

        window.gtag("js", new Date())
        window.gtag("config", gaId, {
          page_title: document.title,
          page_location: window.location.href,
        })

        console.log("GA script loaded successfully")
        console.log("gtag available after load:", typeof window.gtag)
        console.log("dataLayer:", window.dataLayer)
      }
    } else {
      console.log("Google Analytics not loaded - consent:", consent, "gaId:", gaId)
    }
  }, [gaId, consent])

  if (!consent || !gaId) {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        onLoad={() => {
          console.log("GA script loaded from CDN")
        }}
        onError={(e) => {
          console.error("Failed to load GA script:", e)
        }}
      />
    </>
  )
}
