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
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!consent || !gaId) {
      console.log("GA not loaded - consent:", consent, "gaId:", gaId)
      return
    }

    // Функція для ініціалізації Google Analytics
    const initializeGA = () => {
      if (typeof window === "undefined") return

      // Ініціалізуємо dataLayer якщо його немає
      window.dataLayer = window.dataLayer || []

      // Створюємо функцію gtag
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

      // Відправляємо початкову page_view подію
      gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
      })

      initializedRef.current = true
      console.log("✅ Google Analytics initialized successfully!")
      console.log("📊 GA ID:", gaId)
      console.log("📄 Page view sent:", window.location.href)
    }

    // Функція для завантаження скрипта
    const loadGAScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Перевіряємо чи скрипт вже завантажений
        const existingScript = document.querySelector(`script[src*="gtag/js?id=${gaId}"]`)

        if (existingScript) {
          console.log("GA script already exists")
          resolve()
          return
        }

        // Створюємо новий скрипт
        const script = document.createElement("script")
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
        script.async = true

        script.onload = () => {
          console.log("🚀 GA script loaded from CDN")
          scriptLoadedRef.current = true
          resolve()
        }

        script.onerror = (error) => {
          console.error("❌ Failed to load GA script:", error)
          reject(error)
        }

        // Додаємо скрипт до head
        document.head.appendChild(script)
        console.log("📥 Loading GA script...")
      })
    }

    // Основна логіка завантаження та ініціалізації
    const setupGA = async () => {
      try {
        console.log("🔄 Setting up Google Analytics...")

        // Завантажуємо скрипт
        await loadGAScript()

        // Ініціалізуємо GA
        initializeGA()
      } catch (error) {
        console.error("❌ Error setting up Google Analytics:", error)
      }
    }

    // Якщо згода надана, запускаємо налаштування
    if (consent && gaId && !initializedRef.current) {
      setupGA()
    }
  }, [gaId, consent])

  // Відправляємо page_view при зміні consent з false на true
  useEffect(() => {
    if (consent && initializedRef.current && typeof window !== "undefined" && window.gtag) {
      console.log("🔄 Consent changed to true, sending page_view")
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
      })
    }
  }, [consent])

  return null
}

// Допоміжні функції для відстеження
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
    console.log("📊 Event tracked:", { action, category, label, value })
  } else {
    console.warn("⚠️ gtag not available for event tracking")
  }
}

export function trackPageView(url: string, title?: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "page_view", {
      page_location: url,
      page_title: title || document.title,
    })
    console.log("📄 Page view tracked:", url)
  } else {
    console.warn("⚠️ gtag not available for page view tracking")
  }
}
