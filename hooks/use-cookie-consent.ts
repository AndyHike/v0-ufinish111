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

  // Функція для агресивного очищення cookies
  const forceClearCookies = (category: "analytics" | "marketing") => {
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
    const paths = ["/", "/admin", "/auth", ""]

    // Очищення cookies з різними параметрами
    cookiesToClear.forEach((cookieName) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
          const maxAgeZero = "max-age=0"

          const clearVariants = [
            `${cookieName}=; expires=${expireDate}; path=${path}`,
            `${cookieName}=; ${maxAgeZero}; path=${path}`,
            `${cookieName}=deleted; expires=${expireDate}; path=${path}`,
            `${cookieName}=deleted; ${maxAgeZero}; path=${path}`,
          ]

          if (domain) {
            clearVariants.forEach((variant) => {
              document.cookie = `${variant}; domain=${domain}`
              document.cookie = `${variant}; domain=${domain}; SameSite=Lax`
              document.cookie = `${variant}; domain=${domain}; SameSite=None; Secure`
            })
          }

          clearVariants.forEach((variant) => {
            document.cookie = variant
            document.cookie = `${variant}; SameSite=Lax`
            document.cookie = `${variant}; SameSite=None; Secure`
          })
        })
      })
    })

    // Очищення localStorage та sessionStorage для analytics
    if (category === "analytics") {
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("_ga") || key.startsWith("gtag") || key.includes("google")) {
            localStorage.removeItem(key)
          }
        })

        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("_ga") || key.startsWith("gtag") || key.includes("google")) {
            sessionStorage.removeItem(key)
          }
        })
      } catch (error) {
        console.warn("Could not clear storage:", error)
      }
    }

    // Оновлення gtag consent для analytics
    if (typeof window !== "undefined" && window.gtag && category === "analytics") {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      })
    }
  }

  // Функція для форсованої активації Google Analytics
  const forceActivateAnalytics = () => {
    if (typeof window === "undefined") return

    const gaId = "G-WZ0WCHZ3XT"

    // Очищення попередніх GA ресурсів
    const existingScripts = document.querySelectorAll(`script[src*="googletagmanager.com"]`)
    existingScripts.forEach((script) => script.remove())

    // Очищення глобальних змінних
    delete window.gtag
    delete window.dataLayer

    // Створення нового dataLayer
    window.dataLayer = []

    // Створення gtag функції
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }

    // Встановлення часу
    window.gtag("js", new Date())

    // Встановлення згоди як надану
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      functionality_storage: "granted",
      personalization_storage: "granted",
      security_storage: "granted",
    })

    // Створення нового скрипта
    const script = document.createElement("script")
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}&t=${Date.now()}`

    script.onload = () => {
      // Конфігурація GA4
      window.gtag("config", gaId, {
        send_page_view: true,
        page_title: document.title,
        page_location: window.location.href,
        transport_type: "beacon",
        cookie_domain: window.location.hostname,
        cookie_flags: "SameSite=Lax",
      })

      // Відправка подій для активації
      setTimeout(() => {
        window.gtag("event", "page_view", {
          page_title: document.title,
          page_location: window.location.href,
          send_to: gaId,
          transport_type: "beacon",
        })

        window.gtag("event", "analytics_force_activated", {
          event_category: "consent",
          event_label: "force_activation_without_reload",
          send_to: gaId,
          transport_type: "beacon",
        })

        window.gtag("event", "user_engagement", {
          engagement_time_msec: 1,
          send_to: gaId,
          transport_type: "beacon",
        })
      }, 500)
    }

    script.onerror = () => {
      console.warn("Google Analytics script failed to load")
    }

    document.head.appendChild(script)
  }

  // Завантаження збережених налаштувань при ініціалізації
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

  // Збереження згоди та обробка змін
  const saveConsent = (consent: CookieConsent, previousConsent?: CookieConsent) => {
    const consentData = {
      consent,
      consentDate: new Date().toISOString(),
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData))

    // Обробка змін згоди
    if (previousConsent) {
      // Очищення при відкликанні згоди
      if (previousConsent.analytics && !consent.analytics) {
        forceClearCookies("analytics")
      }
      if (previousConsent.marketing && !consent.marketing) {
        forceClearCookies("marketing")
      }
    }

    setState({
      consent,
      showBanner: false,
      hasInteracted: true,
      consentDate: consentData.consentDate,
    })

    // Активація при наданні згоди
    if (consent.analytics && (!previousConsent || !previousConsent.analytics)) {
      setTimeout(() => {
        forceActivateAnalytics()
      }, 200)
    }

    // Facebook Pixel активація обробляється компонентом FacebookPixel
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
