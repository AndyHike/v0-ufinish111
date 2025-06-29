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

  // Функція для очищення cookies
  const clearCookiesByCategory = (category: "analytics" | "marketing") => {
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

    // Очищуємо cookies
    cookiesToClear.forEach((cookieName) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"

          // Різні варіанти очищення
          if (domain) {
            document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=${domain}; SameSite=Lax`
            document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=${domain}; SameSite=None; Secure`
            document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=${domain}`
          }
          document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; SameSite=Lax`
          document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; SameSite=None; Secure`
          document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}`

          // Додаткове очищення з max-age
          if (domain) {
            document.cookie = `${cookieName}=; max-age=0; path=${path}; domain=${domain}`
          }
          document.cookie = `${cookieName}=; max-age=0; path=${path}`
        })
      })
    })

    // Додатково очищуємо localStorage та sessionStorage для GA
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

    // Оновлюємо consent в gtag якщо він існує
    if (typeof window !== "undefined" && window.gtag && category === "analytics") {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      })
    }

    console.log(`${category} cookies cleared:`, cookiesToClear)
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

    // Очищуємо cookies для категорій, які були відключені
    if (previousConsent) {
      if (previousConsent.analytics && !consent.analytics) {
        clearCookiesByCategory("analytics")

        // Додатково оновлюємо gtag consent
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("consent", "update", {
            analytics_storage: "denied",
          })
        }
      }
      if (previousConsent.marketing && !consent.marketing) {
        clearCookiesByCategory("marketing")
      }
    }

    setState({
      consent,
      showBanner: false,
      hasInteracted: true,
      consentDate: consentData.consentDate,
    })

    if (consent.analytics && typeof window !== "undefined") {
      setTimeout(() => {
        if (window.gtag) {
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

          window.gtag("event", "user_engagement", {
            engagement_time_msec: 1000,
            transport_type: "beacon",
          })
        }
      }, 100)
    }
  }

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    })
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
