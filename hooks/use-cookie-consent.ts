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

  // Простіше очищення cookies
  const clearCookies = (category: "analytics" | "marketing") => {
    if (typeof document === "undefined") return

    const cookiesToClear = category === "analytics" ? ["_ga", "_ga_WZ0WCHZ3XT", "_gid", "_gat"] : ["_fbp", "_fbc", "fr"]

    cookiesToClear.forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
    })

    console.log(`Cleared ${category} cookies`)
  }

  // Простіша активація GA
  const activateGA = () => {
    if (typeof window === "undefined") return

    const gaId = "G-WZ0WCHZ3XT"

    // Видаляємо старі скрипти
    document.querySelectorAll('script[src*="googletagmanager.com"]').forEach((s) => s.remove())

    // Очищуємо змінні
    delete window.gtag
    delete window.dataLayer

    // Створюємо dataLayer
    window.dataLayer = []
    window.gtag = () => {
      window.dataLayer.push(arguments)
    }
    window.gtag("js", new Date())
    window.gtag("consent", "default", { analytics_storage: "granted" })

    // Додаємо скрипт
    const script = document.createElement("script")
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`

    script.onload = () => {
      window.gtag("config", gaId, { send_page_view: true })
      console.log("Google Analytics activated")
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
      } catch {
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

    // Обробляємо зміни
    if (previousConsent) {
      if (previousConsent.analytics && !consent.analytics) {
        clearCookies("analytics")
      }
      if (previousConsent.marketing && !consent.marketing) {
        clearCookies("marketing")
      }
    }

    setState({
      consent,
      showBanner: false,
      hasInteracted: true,
      consentDate: consentData.consentDate,
    })

    // Активуємо сервіси
    if (consent.analytics && (!previousConsent || !previousConsent.analytics)) {
      setTimeout(activateGA, 100)
    }

    console.log("Consent saved:", consent)
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
