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

  // Функція для повної ініціалізації GA
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

    // Налаштовуємо consent
    window.gtag("consent", "default", {
      analytics_storage: consent ? "granted" : "denied",
      ad_storage: "denied",
      functionality_storage: "granted",
      personalization_storage: "granted",
      security_storage: "granted",
    })

    // Конфігуруємо GA4 якщо є згода
    if (consent) {
      window.gtag("config", gaId, {
        send_page_view: true,
        page_title: document.title,
        page_location: window.location.href,
        transport_type: "beacon",
      })
    }

    gaInitializedRef.current = true
  }

  // Функція для активації аналітики
  const activateAnalytics = () => {
    if (typeof window === "undefined" || !gaId) return

    // Якщо gtag не існує, створюємо його
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || []
      window.gtag = function gtag() {
        window.dataLayer.push(arguments)
      }
      window.gtag("js", new Date())
    }

    // Оновлюємо consent
    window.gtag("consent", "update", {
      analytics_storage: "granted",
    })

    // Конфігуруємо GA4
    window.gtag("config", gaId, {
      send_page_view: true,
      page_title: document.title,
      page_location: window.location.href,
      transport_type: "beacon",
    })

    // Відправляємо події
    setTimeout(() => {
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
        send_to: gaId,
        transport_type: "beacon",
      })

      window.gtag("event", "analytics_activated", {
        event_category: "consent",
        event_label: "immediate_activation",
        send_to: gaId,
        transport_type: "beacon",
      })

      window.gtag("event", "user_engagement", {
        engagement_time_msec: 1000,
        send_to: gaId,
        transport_type: "beacon",
      })
    }, 200)

    consentProcessedRef.current = true
  }

  // Завантаження скрипта
  useEffect(() => {
    if (!gaId || typeof window === "undefined") return

    const loadScript = async () => {
      // Перевіряємо чи скрипт вже існує
      const existingScript = document.querySelector(`script[src*="gtag/js?id=${gaId}"]`)
      if (existingScript || scriptLoadedRef.current) {
        if (!gaInitializedRef.current) {
          initializeGA()
        }
        if (consent && !consentProcessedRef.current) {
          activateAnalytics()
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

          // Якщо consent вже є, активуємо одразу
          if (consent && !consentProcessedRef.current) {
            setTimeout(() => {
              activateAnalytics()
            }, 300)
          }
        }, 100)
      }

      script.onerror = () => {
        console.warn("Failed to load Google Analytics script")
        scriptLoadedRef.current = false
      }

      document.head.appendChild(script)
    }

    loadScript()
  }, [gaId])

  // Реагування на зміну consent
  useEffect(() => {
    if (!consent) {
      consentProcessedRef.current = false

      // Миттєво очищуємо GA cookies при відкликанні згоди
      if (typeof window !== "undefined") {
        const gaCookies = ["_ga", "_ga_WZ0WCHZ3XT", "_gid", "_gat", "_gat_gtag_G_WZ0WCHZ3XT"]
        const domains = ["", window.location.hostname, "." + window.location.hostname, ".devicehelp.cz"]
        const paths = ["/", "/admin", "/auth"]

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

        // Оновлюємо gtag consent
        if (window.gtag) {
          window.gtag("consent", "update", {
            analytics_storage: "denied",
          })
        }
      }
      return
    }

    // Якщо consent = true
    if (consent && !consentProcessedRef.current) {
      if (scriptLoadedRef.current) {
        // Скрипт вже завантажений, активуємо одразу
        activateAnalytics()
      } else {
        // Скрипт ще не завантажений, чекаємо
        const checkScript = setInterval(() => {
          if (scriptLoadedRef.current) {
            clearInterval(checkScript)
            activateAnalytics()
          }
        }, 100)

        // Очищуємо інтервал через 10 секунд
        setTimeout(() => {
          clearInterval(checkScript)
        }, 10000)
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
