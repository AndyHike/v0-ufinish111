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

      // Конфігуруємо GA4
      window.gtag("config", gaId, {
        send_page_view: true,
        page_title: document.title,
        page_location: window.location.href,
      })

      gaInitializedRef.current = true
      console.log("✅ GA4 configured successfully!")
      console.log("📊 Property ID:", gaId)
      console.log("📄 Current page:", window.location.href)

      // Відправляємо тестову подію для перевірки
      setTimeout(() => {
        window.gtag("event", "ga_initialized", {
          event_category: "system",
          event_label: "automatic_initialization",
          custom_parameter_1: gaId,
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
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Ініціалізуємо GA
        initializeGoogleAnalytics()

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

  return null
}

// Експортуємо функції для ручного відстеження
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
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
    })
    console.log("📄 Page view tracked:", url || window.location.href)
    return true
  } else {
    console.warn("⚠️ gtag not available for page view tracking")
    return false
  }
}
