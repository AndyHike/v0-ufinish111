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

    const cookiesToClear = category === "analytics" ? ["_ga", "_ga_WZ0WCHZ3XT", "_gid", "_gat"] : ["_fbp", "_fbc"]

    cookiesToClear.forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`
    })

    // Очищення localStorage
    if (category === "analytics") {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("_ga")) localStorage.removeItem(key)
      })
    }
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

    // Очищення при відкликанні згоди
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

    // Повідомляємо про зміну згоди
    window.dispatchEvent(
      new CustomEvent("cookieConsentChanged", {
        detail: { consent, previousConsent },
      }),
    )
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
