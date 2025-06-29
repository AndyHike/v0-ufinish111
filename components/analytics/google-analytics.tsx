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

  // Функція для ініціалізації GA
  const initializeGA = () => {
    if (typeof window === "undefined" || !gaId) return

    // Ініціалізуємо dataLayer
    window.dataLayer = window.dataLayer || []

    // Створюємо gtag функцію
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }

    // Встановлюємо час
    window.gtag("js", new Date())

    // Налаштовуємо consent - за замовчуванням denied
    window.gtag("consent", "default", {
      analytics_storage: consent ? "granted" : "denied",
      ad_storage: "denied",
      functionality_storage: "granted",
      personalization_storage: "granted",
      security_storage: "granted",
    })

    // Конфігуруємо GA4 - завжди, але з правильним consent
    window.gtag("config", gaId, {
      send_page_view: consent, // відправляємо page_view тільки якщо є згода
      page_title: document.title,
      page_location: window.location.href,
      transport_type: "beacon",
    })

    gaInitializedRef.current = true
  }

  // Функція для активації аналітики після згоди
  const activateAnalytics = () => {
    if (typeof window === "undefined" || !window.gtag || !gaId) return

    // Оновлюємо consent
    window.gtag("consent", "update", {
      analytics_storage: "granted",
    })

    // Відправляємо page_view одразу
    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      send_to: gaId,
      transport_type: "beacon",
    })

    // Відправляємо подію про активацію
    window.gtag("event", "consent_granted", {
      event_category: "consent",
      event_label: "analytics_activated",
      send_to: gaId,
      transport_type: "beacon",
    })

    console.log("Google Analytics activated immediately")
  }

  // Функція для деактивації аналітики
  const deactivateAnalytics = () => {
    if (typeof window === "undefined" || !window.gtag) return

    window.gtag("consent", "update", {
      analytics_storage: "denied",
    })

    console.log("Google Analytics deactivated")
  }

  // Завантаження скрипта - завжди завантажуємо
  useEffect(() => {
    if (!gaId || typeof window === "undefined") return

    const loadScript = async () => {
      // Перевіряємо чи скрипт вже існує
      const existingScript = document.querySelector(`script[src*="gtag/js?id=${gaId}"]`)
      if (existingScript || scriptLoadedRef.current) {
        if (!gaInitializedRef.current) {
          initializeGA()
        }
        return
      }

      const script = document.createElement("script")
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`

      script.onload = () => {
        scriptLoadedRef.current = true
        // Ініціалізуємо GA після завантаження скрипта
        setTimeout(() => {
          initializeGA()
        }, 100)
      }

      document.head.appendChild(script)
    }

    loadScript()
  }, [gaId])

  // Реагування на зміну consent
  useEffect(() => {
    if (!gaInitializedRef.current || !scriptLoadedRef.current) return

    if (consent) {
      activateAnalytics()
    } else {
      deactivateAnalytics()
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
  } else {
    return false
  }
}

export const trackPageView = (url?: string, title?: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "page_view", {
      page_location: url || window.location.href,
      page_title: title || document.title,
      transport_type: "beacon",
    })
    return true
  } else {
    return false
  }
}
