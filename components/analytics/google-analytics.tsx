"use client"

import { useEffect } from "react"
import Script from "next/script"

interface GoogleAnalyticsProps {
  gaId: string
  consent: boolean
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
      })

      console.log("Google Analytics initialized with ID:", gaId)
    }
  }, [gaId, consent])

  if (!consent || !gaId) {
    return null
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
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
  }
}

// Функція для відстеження переглядів сторінок
export function trackPageView(url: string, title?: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", "GA_MEASUREMENT_ID", {
      page_location: url,
      page_title: title,
    })
  }
}
