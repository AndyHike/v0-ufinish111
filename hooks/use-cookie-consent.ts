"use client"

import { useState, useEffect } from "react"
import type { CookieConsent, CookieConsentState } from "@/types/cookie-consent"

const COOKIE_CONSENT_KEY = "cookie-consent"
const CONSENT_EXPIRY_DAYS = 365

export function useCookieConsent() {
  const [state, setState] = useState<CookieConsentState>({
    consent: {
      necessary: true,
      analytics: false,
      marketing: false,
    },
    showBanner: false,
    hasInteracted: false,
    consentDate: null,
  })

  // Функція для миттєвого очищення cookies в реальному часі
  const clearCookiesImmediately = (category: "analytics" | "marketing") => {
    if (typeof document === "undefined") return

    let cookiesToClear: string[] = []

    if (category === "analytics") {
      cookiesToClear = [
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
        "AMP_TOKEN",
        "_gac_gb_",
      ]
    } else if (category === "marketing") {
      cookiesToClear = ["_fbp", "_fbc", "fr", "_gcl_aw", "_gcl_dc", "_gcl_gb", "_gcl_gf", "_gcl_ha"]
    }

    const domains = ["", window.location.hostname, "." + window.location.hostname, ".devicehelp.cz", "devicehelp.cz"]
    const paths = ["/", "/admin", "/auth"]

    // Агресивне очищення cookies
    cookiesToClear.forEach((cookieName) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"

          // Множинні спроби очищення
          if (domain) {
            document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=${domain}; SameSite=Lax`
            document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=${domain}; SameSite=None; Secure`
            document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=${domain}`
            document.cookie = `${cookieName}=; max-age=0; path=${path}; domain=${domain}`
          }
          document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; SameSite=Lax`
          document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; SameSite=None; Secure`
          document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}`
          document.cookie = `${cookieName}=; max-age=0; path=${path}`
        })
      })
    })

    // Очищення localStorage та sessionStorage
    if (category === "analytics") {
      try {
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith("_ga") || key.startsWith("gtag") || key.includes("google"))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key))

        const sessionKeysToRemove = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key && (key.startsWith("_ga") || key.startsWith("gtag") || key.includes("google"))) {
            sessionKeysToRemove.push(key)
          }
        }
        sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key))
      } catch (error) {
        console.warn("Could not clear storage:", error)
      }
    }

    // Оновлення gtag consent
    if (typeof window !== "undefined" && window.gtag && category === "analytics") {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      })
    }

    console.log(`${category} cookies cleared immediately:`, cookiesToClear)

    // Примусове оновлення DOM для миттєвого відображення змін
    setTimeout(() => {
      // Тригеримо подію для оновлення DevTools
      window.dispatchEvent(new Event("cookiesCleared"))
    }, 100)
  }

  // Функція для миттєвої активації аналітики
  const activateAnalyticsImmediately = () => {
    if (typeof window === "undefined") return

    // Створюємо або перезавантажуємо Google Analytics скрипт
    const gaId = "G-WZ0WCHZ3XT" // Ваш GA ID

    // Видаляємо старий скрипт якщо існує
    const existingScript = document.querySelector(`script[src*="gtag/js?id=${gaId}"]`)
    if (existingScript) {
      existingScript.remove()
    }

    // Очищуємо dataLayer
    window.dataLayer = []

    // Створюємо новий скрипт
    const script = document.createElement("script")
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`

    script.onload = () => {
      // Ініціалізуємо gtag
      window.gtag = function gtag() {
        window.dataLayer.push(arguments)
      }

      window.gtag("js", new Date())

      // Встановлюємо consent як granted
      window.gtag("consent", "default", {
        analytics_storage: "granted",
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

      // Відправляємо початкові події
      setTimeout(() => {
        window.gtag("event", "page_view", {
          page_title: document.title,
          page_location: window.location.href,
          send_to: gaId,
          transport_type: "beacon",
        })

        window.gtag("event", "analytics_activated_immediate", {
          event_category: "consent",
          event_label: "immediate_activation_without_reload",
          send_to: gaId,
          transport_type: "beacon",
        })

        window.gtag("event", "user_engagement", {
          engagement_time_msec: 1000,
          send_to: gaId,
          transport_type: "beacon",
        })

        console.log("Google Analytics activated immediately without page reload")
      }, 500)
    }

    script.onerror = () => {
      console.warn("Failed to load Google Analytics script")
    }

    document.head.appendChild(script)
  }

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const consentDate = new Date(parsed.consentDate)
        const now = new Date()
        const daysDiff = (now.getTime() - consentDate.getTime()) / (1000 * 3600 * 24)

        if (daysDiff < CONSENT_EXPIRY_DAYS) {
          setState({
            consent: parsed.consent,
            showBanner: false,
            hasInteracted: true,
            consentDate: parsed.consentDate,
          })
        } else {
          setState((prev) => ({ ...prev, showBanner: true }))
        }
      } catch (error) {
        setState((prev) => ({ ...prev, showBanner: true }))
      }
    } else {
      setState((prev) => ({ ...prev, showBanner: true }))
    }
  }, [])

  const saveConsent = (consent: CookieConsent, previousConsent?: CookieConsent) => {
    const consentData = {
      consent,
      consentDate: new Date().toISOString(),
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData))

    // Миттєво очищуємо cookies для відключених категорій
    if (previousConsent) {
      if (previousConsent.analytics && !consent.analytics) {
        clearCookiesImmediately("analytics")
      }
      if (previousConsent.marketing && !consent.marketing) {
        clearCookiesImmediately("marketing")
      }
    }

    setState({
      consent,
      showBanner: false,
      hasInteracted: true,
      consentDate: consentData.consentDate,
    })

    // Миттєва активація аналітики при згоді
    if (consent.analytics) {
      // Якщо раніше не було згоди, або якщо це нова згода
      if (!previousConsent?.analytics) {
        activateAnalyticsImmediately()
      } else if (typeof window !== "undefined" && window.gtag) {
        // Якщо gtag вже існує, просто оновлюємо consent
        window.gtag("consent", "update", {
          analytics_storage: "granted",
        })

        window.gtag("event", "page_view", {
          page_title: document.title,
          page_location: window.location.href,
          transport_type: "beacon",
        })

        window.gtag("event", "consent_granted_immediate", {
          event_category: "consent",
          event_label: "user_accepted_analytics",
          transport_type: "beacon",
        })
      }
    }
  }

  const acceptAll = () => {
    const previousConsent = state.consent
    saveConsent(
      {
        necessary: true,
        analytics: true,
        marketing: true,
      },
      previousConsent,
    )
  }

  const acceptNecessary = () => {
    const previousConsent = state.consent
    saveConsent(
      {
        necessary: true,
        analytics: false,
        marketing: false,
      },
      previousConsent,
    )
  }

  const updateCategory = (category: keyof CookieConsent, value: boolean) => {
    setState((prev) => ({
      ...prev,
      consent: {
        ...prev.consent,
        [category]: category === "necessary" ? true : value,
      },
    }))
  }

  const saveCurrentSettings = () => {
    const previousConsent = { ...state.consent }
    saveConsent(state.consent, previousConsent)
  }

  const setShowBanner = (show: boolean) => {
    setState((prev) => ({ ...prev, showBanner: show }))
  }

  return {
    ...state,
    acceptAll,
    acceptNecessary,
    updateCategory,
    saveCurrentSettings,
    setShowBanner,
  }
}
