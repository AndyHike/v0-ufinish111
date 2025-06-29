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
    console.log("Removing GA script and cleaning up...")

    // Видаляємо всі GA скрипти
    const scripts = document.querySelectorAll(`script[src*="gtag/js"], script[src*="googletagmanager.com"]`)
    scripts.forEach((script) => {
      script.remove()
      console.log("Removed GA script:", script.getAttribute("src"))
    })

    // Очищуємо dataLayer та gtag
    if (typeof window !== "undefined") {
      window.dataLayer = []
      delete window.gtag
      console.log("Cleared dataLayer and gtag")
    }

    // Очищуємо всі GA cookies
    clearAllGACookies()

    scriptLoadedRef.current = false
    gaInitializedRef.current = false
  }

  const clearAllGACookies = () => {
    if (typeof document === "undefined") return

    const gaCookies = [
      "_ga",
      "_ga_WZ0WCHZ3XT",
      "_gid",
      "_gat",
      "_gat_gtag_G_WZ0WCHZ3XT",
      "__utma",
      "__utmb",
      "__utmc",
      "__utmt",
      "__utmz",
      "_gcl_au",
    ]

    const domains = ["", window.location.hostname, "." + window.location.hostname]
    const paths = ["/", "/admin", "/auth"]

    gaCookies.forEach((cookieName) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
          if (domain) {
            document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=${domain}`
          }
          document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}`
        })
      })
    })

    console.log("All GA cookies cleared")
  }

  // Функція для завантаження та ініціалізації GA
  const loadAndInitializeGA = () => {
    if (!gaId || typeof window === "undefined" || !consent) return

    console.log("Loading and initializing GA with consent:", consent)

    // Перевіряємо чи скрипт вже завантажений
    if (scriptLoadedRef.current && gaInitializedRef.current) {
      console.log("GA already loaded and initialized")
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
      console.log("GA script loaded successfully")

      // Конфігуруємо GA4 НЕГАЙНО після завантаження
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

  // Слухач для негайних змін consent
  useEffect(() => {
    const handleConsentChange = (event: CustomEvent) => {
      const { consent: newConsent, immediate, reset } = event.detail
      console.log("Consent changed event received:", { newConsent, immediate, reset })

      if (reset || !newConsent.analytics) {
        // Негайно видаляємо GA при скиданні або відкликанні згоди
        removeGAScript()
      } else if (newConsent.analytics && immediate) {
        // Негайно завантажуємо GA при наданні згоди
        setTimeout(() => {
          loadAndInitializeGA()
        }, 100)
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("cookieConsentChanged", handleConsentChange as EventListener)
      return () => {
        window.removeEventListener("cookieConsentChanged", handleConsentChange as EventListener)
      }
    }
  }, [gaId])

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
