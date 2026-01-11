"use client"

import { useState, useEffect, useCallback } from "react"
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

  const clearCookies = useCallback((category: "analytics" | "marketing") => {
    if (typeof document === "undefined") return

    const cookiesToClear =
      category === "analytics"
        ? ["_ga", "_ga_WZ0WCHZ3XT", "_gid", "_gat"]
        : ["_fbp", "_fbc", "fr", "_gcl_aw", "_gcl_dc"]

    const domains = [
      "",
      window.location.hostname,
      "." + window.location.hostname,
      "." + window.location.hostname.replace(/^www\./, ""),
    ]

    cookiesToClear.forEach((name) => {
      domains.forEach((domain) => {
        const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
        const cookieString = domain
          ? `${name}=; expires=${expireDate}; path=/; domain=${domain}`
          : `${name}=; expires=${expireDate}; path=/`
        document.cookie = cookieString
      })
    })

    if (category === "analytics") {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("_ga")) localStorage.removeItem(key)
      })
    } else if (category === "marketing") {
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("facebook") || key.includes("_fb")) {
          localStorage.removeItem(key)
        }
      })
    }
  }, [])

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
        console.error("Error parsing stored consent:", error)
        setState((prev) => ({ ...prev, showBanner: true }))
      }
    } else {
      setState((prev) => ({ ...prev, showBanner: true }))
    }
  }, [])

  const saveConsent = useCallback(
    (consent: CookieConsent, previousConsent?: CookieConsent) => {
      const consentData = {
        consent,
        consentDate: new Date().toISOString(),
      }

      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData))

      let needsReload = false

      if (previousConsent) {
        if (previousConsent.analytics && !consent.analytics) {
          clearCookies("analytics")
        }
        if (previousConsent.marketing && !consent.marketing) {
          clearCookies("marketing")
          needsReload = true
        }
      }

      setState({
        consent,
        showBanner: false,
        hasInteracted: true,
        consentDate: consentData.consentDate,
      })

      window.dispatchEvent(
        new CustomEvent("cookieConsentChanged", {
          detail: { consent, previousConsent },
        }),
      )

      if (needsReload) {
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    },
    [clearCookies],
  )

  const acceptAll = useCallback(() => {
    const previousConsent = state.consent
    saveConsent(
      {
        necessary: true,
        analytics: true,
        marketing: true,
      },
      previousConsent,
    )
  }, [state.consent, saveConsent])

  const acceptNecessary = useCallback(() => {
    const previousConsent = state.consent
    saveConsent(
      {
        necessary: true,
        analytics: false,
        marketing: false,
      },
      previousConsent,
    )
  }, [state.consent, saveConsent])

  const updateCategory = useCallback((category: keyof CookieConsent, value: boolean) => {
    setState((prev) => ({
      ...prev,
      consent: {
        ...prev.consent,
        [category]: category === "necessary" ? true : value,
      },
    }))
  }, [])

  const saveCurrentSettings = useCallback(() => {
    const previousConsent = { ...state.consent }
    saveConsent(state.consent, previousConsent)
  }, [state.consent, saveConsent])

  const setShowBanner = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showBanner: show }))
  }, [])

  return {
    ...state,
    acceptAll,
    acceptNecessary,
    updateCategory,
    saveCurrentSettings,
    setShowBanner,
  }
}
