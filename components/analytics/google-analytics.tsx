"use client"

import { useEffect } from "react"

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
    if (!consent || !gaId) return

    // Перевіряємо чи вже завантажений скрипт
    const existingScript = document.querySelector(`script[src*="gtag/js?id=${gaId}"]`)

    if (!existingScript) {
      // Ініціалізуємо dataLayer
      window.dataLayer = window.dataLayer || []
      window.gtag = function gtag() {
        window.dataLayer.push(arguments)
      }

      // Створюємо та додаємо скрипт
      const script = document.createElement("script")
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
      script.async = true

      script.onload = () => {
        // Конфігуруємо GA після завантаження скрипта
        window.gtag("js", new Date())
        window.gtag("config", gaId, {
          page_title: document.title,
          page_location: window.location.href,
        })

        // Відправляємо початкову подію page_view
        window.gtag("event", "page_view", {
          page_title: document.title,
          page_location: window.location.href,
        })
      }

      document.head.appendChild(script)
    } else if (window.gtag) {
      // Якщо скрипт вже завантажений, просто відправляємо page_view
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
      })
    }
  }, [gaId, consent])

  // Відправляємо page_view при зміні consent з false на true
  useEffect(() => {
    if (consent && window.gtag) {
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
      })
    }
  }, [consent])

  return null
}
