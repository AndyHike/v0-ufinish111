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
  const lastConsentRef = useRef(consent)

  // Функція для повного очищення GA
  const cleanupGA = () => {
    if (typeof window === "undefined") return

    // Видаляємо всі GA скрипти
    const scripts = document.querySelectorAll(
      `script[src*="googletagmanager.com"], script[src*="google-analytics.com"]`,
    )
    scripts.forEach((script) => script.remove())

    // Очищуємо глобальні змінні
    delete window.gtag
    delete window.dataLayer

    // Очищуємо cookies
    const gaCookies = ["_ga", "_ga_WZ0WCHZ3XT", "_gid", "_gat", "_gat_gtag_G_WZ0WCHZ3XT"]
    const domains = ["", window.location.hostname, "." + window.location.hostname, ".devicehelp.cz"]
    const paths = ["/", "/admin", "/auth", ""]

    gaCookies.forEach((cookieName) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
          if (domain) {
            document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=${domain}`
            document.cookie = `${cookieName}=; max-age=0; path=${path}; domain=${domain}`
          }
          document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}`
          document.cookie = `${cookieName}=; max-age=0; path=${path}`
        })
      })
    })

    // Скид��ємо стан
    scriptLoadedRef.current = false
    gaInitializedRef.current = false
    consentProcessedRef.current = false
  }

  // Функція для ініціалізації GA з нуля
  const initializeGAFromScratch = () => {
    if (typeof window === "undefined" || !gaId || !consent) return

    // Спочатку очищуємо все
    cleanupGA()

    // Створюємо новий dataLayer
    window.dataLayer = []

    // Створюємо gtag функцію
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }

    // Встановлюємо час
    window.gtag("js", new Date())

    // Встановлюємо consent
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      functionality_storage: "granted",
      personalization_storage: "granted",
      security_storage: "granted",
    })

    // Створюємо новий скрипт з унікальним timestamp
    const script = document.createElement("script")
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}&t=${Date.now()}`

    script.onload = () => {
      scriptLoadedRef.current = true

      // Конфігуруємо GA4
      window.gtag("config", gaId, {
        send_page_view: true,
        page_title: document.title,
        page_location: window.location.href,
        transport_type: "beacon",
        cookie_domain: window.location.hostname,
        cookie_flags: "SameSite=Lax",
      })

      gaInitializedRef.current = true

      // Відправляємо початкові події
      setTimeout(() => {
        window.gtag("event", "page_view", {
          page_title: document.title,
          page_location: window.location.href,
          send_to: gaId,
          transport_type: "beacon",
        })

        window.gtag("event", "analytics_initialized", {
          event_category: "consent",
          event_label: "fresh_initialization",
          send_to: gaId,
          transport_type: "beacon",
        })

        consentProcessedRef.current = true
      }, 300)
    }

    document.head.appendChild(script)
  }

  // Основний useEffect для обробки змін consent
  useEffect(() => {
    const consentChanged = lastConsentRef.current !== consent
    lastConsentRef.current = consent

    if (!consent) {
      // Якщо згода відкликана
      if (consentChanged) {
        cleanupGA()
      }
      return
    }

    // Якщо згода надана
    if (consent && consentChanged) {
      // Ініціалізуємо GA з нуля при зміні згоди
      setTimeout(() => {
        initializeGAFromScratch()
      }, 100)
    } else if (consent && !gaInitializedRef.current) {
      // Ініціалізуємо GA якщо ще не ініціалізований
      initializeGAFromScratch()
    }
  }, [consent, gaId])

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      if (!consent) {
        cleanupGA()
      }
    }
  }, [])

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
