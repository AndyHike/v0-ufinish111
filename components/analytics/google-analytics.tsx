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
    if (consent && gaId && typeof window !== "undefined") {
      // Ініціалізуємо dataLayer
      window.dataLayer = window.dataLayer || []

      // Функція gtag
      function gtag(...args: any[]) {
        window.dataLayer.push(args)
      }

      // Встановлюємо gtag глобально
      window.gtag = gtag

      // Ініціалізуємо Google Analytics
      gtag("js", new Date())
      gtag("config", gaId, {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: true,
      })

      // Відправляємо додатковий page_view event
      gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
      })

      console.log("Google Analytics initialized with ID:", gaId)
      console.log("Page view sent to GA4")
      console.log("Current URL:", window.location.href)
      console.log("DataLayer:", window.dataLayer)
    }
  }, [gaId, consent])

  if (!consent || !gaId) {
    console.log("GA not loaded - consent:", consent, "gaId:", gaId)
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
        onLoad={() => console.log("GA script loaded successfully")}
        onError={() => console.error("Failed to load GA script")}
      />
    </>
  )
}

// Функція для відстеження подій
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
    console.log("Event tracked:", { action, category, label, value })
  }
}

// Функція для відстеження переглядів сторінок
export function trackPageView(url: string, title?: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "page_view", {
      page_location: url,
      page_title: title || document.title,
    })
    console.log("Page view tracked:", { url, title })
  }
}
