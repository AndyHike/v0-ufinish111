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
    ga_debug?: boolean
  }
}

export function GoogleAnalytics({ gaId, consent }: GoogleAnalyticsProps) {
  const scriptLoadedRef = useRef(false)
  const gaInitializedRef = useRef(false)
  const consentGrantedRef = useRef(false)

  useEffect(() => {
    if (!consent || !gaId || typeof window === "undefined") {
      console.log("❌ GA not initialized:", { consent, gaId, window: typeof window })
      return
    }

    console.log("🚀 Starting GA initialization process...")

    const initializeGoogleAnalytics = () => {
      // Ініціалізуємо dataLayer
      window.dataLayer = window.dataLayer || []

      // Створюємо gtag функцію
      window.gtag = function gtag() {
        window.dataLayer.push(arguments)
      }

      // Встановлюємо час
      window.gtag("js", new Date())

      // ВАЖЛИВО: Спочатку налаштовуємо consent
      window.gtag("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "denied",
        functionality_storage: "granted",
        personalization_storage: "granted",
        security_storage: "granted",
      })

      // Конфігуруємо GA4 з правильними параметрами
      window.gtag("config", gaId, {
        send_page_view: true,
        page_title: document.title,
        page_location: window.location.href,
        transport_type: "beacon", // Важливо для надійної відправки
        custom_map: {
          custom_parameter_1: "dimension1",
        },
      })

      gaInitializedRef.current = true
      console.log("✅ GA4 configured successfully!")
      console.log("📊 Property ID:", gaId)
      console.log("📄 Current page:", window.location.href)

      // Форсуємо відправку початкової події
      setTimeout(() => {
        window.gtag("event", "page_view", {
          page_title: document.title,
          page_location: window.location.href,
          send_to: gaId,
        })
        console.log("📄 Manual page_view sent")
      }, 500)

      // Відправляємо тестову подію для перевірки
      setTimeout(() => {
        window.gtag("event", "ga_initialized", {
          event_category: "system",
          event_label: "automatic_initialization",
          send_to: gaId,
          transport_type: "beacon",
        })
        console.log("🎯 Test event sent: ga_initialized")
      }, 1000)
    }

    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Перевіряємо чи скрипт вже існує
        const existingScript = document.querySelector(`script[src*="gtag/js?id=${gaId}"]`)
        if (existingScript) {
          console.log("📦 GA script already exists")
          resolve()
          return
        }

        console.log("📥 Loading GA script from CDN...")
        const script = document.createElement("script")
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`

        script.onload = () => {
          console.log("✅ GA script loaded successfully")
          scriptLoadedRef.current = true
          resolve()
        }

        script.onerror = (error) => {
          console.error("❌ Failed to load GA script:", error)
          reject(error)
        }

        document.head.appendChild(script)
      })
    }

    const setupGA = async () => {
      try {
        // Завантажуємо скрипт
        await loadScript()

        // Чекаємо трохи щоб скрипт повністю завантажився
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Ініціалізуємо GA
        initializeGoogleAnalytics()

        // Додаткова затримка для стабільності
        setTimeout(() => {
          if (window.gtag) {
            // Форсуємо відправку даних
            window.gtag("event", "consent_granted", {
              event_category: "consent",
              event_label: "analytics_consent_granted",
              send_to: gaId,
              transport_type: "beacon",
            })
            console.log("🍪 Consent granted event sent")
          }
        }, 2000)

        console.log("🎉 Google Analytics setup completed!")
      } catch (error) {
        console.error("❌ Error setting up Google Analytics:", error)
      }
    }

    // Запускаємо налаштування тільки якщо ще не ініціалізовано
    if (!gaInitializedRef.current) {
      setupGA()
    }

    // Cleanup function
    return () => {
      console.log("🧹 GA component cleanup")
    }
  }, [gaId, consent])

  // Окремий useEffect для відстеження зміни consent
  useEffect(() => {
    if (consent && gaInitializedRef.current && !consentGrantedRef.current) {
      console.log("🔄 Consent changed to true, forcing data send...")
      consentGrantedRef.current = true

      if (typeof window !== "undefined" && window.gtag) {
        // Оновлюємо consent
        window.gtag("consent", "update", {
          analytics_storage: "granted",
        })

        // Форсуємо відправку page_view
        window.gtag("event", "page_view", {
          page_title: document.title,
          page_location: window.location.href,
          send_to: gaId,
          transport_type: "beacon",
        })

        // Відправляємо подію про зміну consent
        window.gtag("event", "consent_update", {
          event_category: "consent",
          event_label: "analytics_enabled_dynamically",
          send_to: gaId,
          transport_type: "beacon",
        })

        console.log("🚀 Forced data send after consent change")
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
      transport_type: "beacon", // Важливо для надійної відправки
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
