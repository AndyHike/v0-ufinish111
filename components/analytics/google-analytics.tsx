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
      // Відключаємо ecommerce tracking на адмін сторінках
      allow_enhanced_conversions: false,
      allow_ad_personalization_signals: false,
      custom_map: {},
    })

    gaInitializedRef.current = true
  }

  // Функція для активації аналітики після згоди
  const activateAnalytics = () => {
    if (typeof window === "undefined" || !window.gtag || !gaId) return

    // Перевіряємо чи це адмін сторінка
    const isAdminPage = window.location.pathname.includes("/admin")
    const isAuthPage = window.location.pathname.includes("/auth")

    // Оновлюємо consent
    window.gtag("consent", "update", {
      analytics_storage: "granted",
    })

    // Відправляємо page_view одразу (але без ecommerce даних для адмін сторінок)
    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      send_to: gaId,
      transport_type: "beacon",
      // Відключаємо ecommerce для адмін/auth сторінок
      ...(isAdminPage || isAuthPage
        ? {
            custom_parameter_ecommerce: false,
            enhanced_ecommerce: false,
          }
        : {}),
    })

    // Відправляємо подію про активацію тільки для звичайних сторінок
    if (!isAdminPage && !isAuthPage) {
      window.gtag("event", "analytics_activated", {
        event_category: "consent",
        event_label: "immediate_activation",
        send_to: gaId,
        transport_type: "beacon",
      })
    }

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
            }, 500)
          }
        }, 100)
      }

      document.head.appendChild(script)
    }

    loadScript()
  }, [gaId])

  // Реагування на зміну consent
  useEffect(() => {
    if (!consent || consentProcessedRef.current) return

    if (gaInitializedRef.current && scriptLoadedRef.current) {
      // GA вже готовий, активуємо одразу
      activateAnalytics()
    } else {
      // Чекаємо поки GA буде готовий
      const checkGA = setInterval(() => {
        if (gaInitializedRef.current && scriptLoadedRef.current && typeof window !== "undefined" && window.gtag) {
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

// Експортуємо функції для ручного відстеження (без логування)
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
