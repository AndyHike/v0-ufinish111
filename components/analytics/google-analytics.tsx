"use client"

import { useEffect, useRef } from "react"

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
  const scriptLoadedRef = useRef(false)
  const gaInitializedRef = useRef(false)

  // Функція для повного видалення GA скрипта
  const removeGAScript = () => {
    const scripts = document.querySelectorAll(`script[src*="gtag/js?id=${gaId}"]`)
    scripts.forEach((script) => script.remove())

    // Очищуємо dataLayer
    if (typeof window !== "undefined") {
      window.dataLayer = []
      delete window.gtag
    }

    scriptLoadedRef.current = false
    gaInitializedRef.current = false
  }

  // Функція для завантаження та ініціалізації GA
  const loadAndInitializeGA = () => {
    if (!gaId || typeof window === "undefined" || !consent) return

    // Перевіряємо чи скрипт вже завантажений
    if (scriptLoadedRef.current && gaInitializedRef.current) {
      return
    }

    // Ініціалізуємо dataLayer
    window.dataLayer = window.dataLayer || []

    // Створюємо gtag функцію
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }

    // Встановлюємо час
    window.gtag("js", new Date())

    // Налаштовуємо consent - дозволяємо тільки якщо є згода
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      functionality_storage: "granted",
      personalization_storage: "granted",
      security_storage: "granted",
    })

    // Завантажуємо скрипт
    const script = document.createElement("script")
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`

    script.onload = () => {
      scriptLoadedRef.current = true

      // Конфігуруємо GA4 після завантаження
      setTimeout(() => {
        if (window.gtag && consent) {
          window.gtag("config", gaId, {
            send_page_view: true,
            page_title: document.title,
            page_location: window.location.href,
            transport_type: "beacon",
          })

          // Відправляємо подію про активацію
          window.gtag("event", "analytics_activated", {
            event_category: "consent",
            event_label: "immediate_activation",
            send_to: gaId,
            transport_type: "beacon",
          })

          gaInitializedRef.current = true
          console.log("Google Analytics loaded and activated immediately")
        }
      }, 100)
    }

    script.onerror = () => {
      console.error("Failed to load Google Analytics script")
      scriptLoadedRef.current = false
    }

    document.head.appendChild(script)
  }

  // Ефект для керування GA на основі consent
  useEffect(() => {
    if (consent) {
      // Якщо є згода - завантажуємо GA
      loadAndInitializeGA()
    } else {
      // Якщо немає згоди - видаляємо GA повністю
      removeGAScript()
      console.log("Google Analytics removed - no consent")
    }

    // Cleanup при unmount
    return () => {
      if (!consent) {
        removeGAScript()
      }
    }
  }, [consent, gaId])

  return null
}

// Експортуємо функції для ручного відстеження
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
      transport_type: "beacon",
    })
    return true
  }
  return false
}

export const trackPageView = (url?: string, title?: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "page_view", {
      page_location: url || window.location.href,
      page_title: title || document.title,
      transport_type: "beacon",
    })
    return true
  }
  return false
}
