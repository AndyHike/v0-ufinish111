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
  const consentProcessedRef = useRef(false)

  // Функція для ініціалізації GA
  const initializeGA = () => {
    if (typeof window === "undefined" || !gaId) return

    console.log("🚀 Initializing Google Analytics...")

    // Ініціалізуємо dataLayer
    window.dataLayer = window.dataLayer || []

    // Створюємо gtag функцію
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }

    // Встановлюємо час
    window.gtag("js", new Date())

    // Налаштовуємо consent
    window.gtag("consent", "default", {
      analytics_storage: consent ? "granted" : "denied",
      ad_storage: "denied",
      functionality_storage: "granted",
      personalization_storage: "granted",
      security_storage: "granted",
    })

    // Конфігуруємо GA4
    window.gtag("config", gaId, {
      send_page_view: true,
      page_title: document.title,
      page_location: window.location.href,
      transport_type: "beacon",
    })

    gaInitializedRef.current = true
    console.log("✅ GA4 initialized with ID:", gaId)
  }

  // Функція для активації аналітики після згоди
  const activateAnalytics = () => {
    if (typeof window === "undefined" || !window.gtag || !gaId) return

    console.log("🔥 ACTIVATING ANALYTICS IMMEDIATELY!")

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
    window.gtag("event", "analytics_activated", {
      event_category: "consent",
      event_label: "immediate_activation",
      send_to: gaId,
      transport_type: "beacon",
    })

    // Відправляємо додаткову подію для впевненості
    window.gtag("event", "user_engagement", {
      engagement_time_msec: 1000,
      send_to: gaId,
      transport_type: "beacon",
    })

    console.log("📊 Analytics data sent immediately!")
    consentProcessedRef.current = true
  }

  // Завантаження скрипта
  useEffect(() => {
    if (!gaId || typeof window === "undefined") return

    const loadScript = async () => {
      // Перевіряємо чи скрипт вже існує
      const existingScript = document.querySelector(`script[src*="gtag/js?id=${gaId}"]`)
      if (existingScript || scriptLoadedRef.current) {
        console.log("📦 GA script already loaded")
        if (!gaInitializedRef.current) {
          initializeGA()
        }
        return
      }

      console.log("📥 Loading GA script...")
      const script = document.createElement("script")
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`

      script.onload = () => {
        console.log("✅ GA script loaded successfully")
        scriptLoadedRef.current = true

        // Ініціалізуємо GA після завантаження скрипта
        setTimeout(() => {
          initializeGA()

          // Якщо consent вже є, активуємо одразу
          if (consent && !consentProcessedRef.current) {
            setTimeout(() => {
              activateAnalytics()
            }, 500)
          }
        }, 100)
      }

      script.onerror = (error) => {
        console.error("❌ Failed to load GA script:", error)
      }

      document.head.appendChild(script)
    }

    loadScript()
  }, [gaId])

  // Реагування на зміну consent
  useEffect(() => {
    if (!consent || consentProcessedRef.current) return

    console.log("🍪 Consent granted, checking GA status...")

    if (gaInitializedRef.current && scriptLoadedRef.current) {
      // GA вже готовий, активуємо одразу
      console.log("⚡ GA ready, activating immediately!")
      activateAnalytics()
    } else {
      // Чекаємо поки GA буде готовий
      console.log("⏳ Waiting for GA to be ready...")
      const checkGA = setInterval(() => {
        if (gaInitializedRef.current && scriptLoadedRef.current && typeof window !== "undefined" && window.gtag) {
          console.log("⚡ GA now ready, activating!")
          clearInterval(checkGA)
          activateAnalytics()
        }
      }, 100)

      // Очищуємо інтервал через 10 секунд якщо щось пішло не так
      setTimeout(() => {
        clearInterval(checkGA)
      }, 10000)
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
    console.log("📊 Event tracked:", { action, category, label, value })
    return true
  } else {
    console.warn("⚠️ gtag not available for event tracking")
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
    console.log("📄 Page view tracked:", url || window.location.href)
    return true
  } else {
    console.warn("⚠️ gtag not available for page view tracking")
    return false
  }
}
