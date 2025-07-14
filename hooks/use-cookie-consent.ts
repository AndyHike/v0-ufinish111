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

    console.log(`🧹 Clearing ${category} cookies`)

    const cookiesToClear = category === "analytics" ? ["_ga", "_ga_WZ0WCHZ3XT", "_gid", "_gat"] : ["_fbp", "_fbc"]

    const domains = ["", window.location.hostname, `.${window.location.hostname.replace(/^www\./, "")}`]

    cookiesToClear.forEach((name) => {
      domains.forEach((domain) => {
        const cookieString = domain
          ? `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`
          : `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
        document.cookie = cookieString
      })
    })

    // Очищення localStorage
    try {
      const storagePrefix = category === "analytics" ? "_ga" : "_fb"
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(storagePrefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn("Could not clear localStorage:", error)
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

    console.log("💾 Saving consent:", { consent, previousConsent })

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
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("cookieConsentChanged", {
          detail: { consent, previousConsent, timestamp: Date.now() },
        }),
      )
    }, 50)
  }

  const acceptAll = () => {
    const previousConsent = state.consent
    console.log("✅ Accepting all cookies")
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
    console.log("⚠️ Accepting only necessary cookies")
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
    console.log("💾 Saving current settings")
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
