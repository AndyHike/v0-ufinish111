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

  // Function to force GA cookies creation and activation
  const forceActivateAnalytics = () => {
    if (typeof window === "undefined") return

    console.log("🚀 Force activating Google Analytics...")

    const gaId = "G-WZ0WCHZ3XT"

    // Completely clear previous GA resources
    const existingScripts = document.querySelectorAll(`script[src*="googletagmanager.com"]`)
    existingScripts.forEach((script) => script.remove())

    // Clear global variables
    delete window.gtag
    delete window.dataLayer

    // Create new dataLayer
    window.dataLayer = []

    // Create gtag function
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }

    // Set time
    window.gtag("js", new Date())

    // Set consent as granted
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      functionality_storage: "granted",
      personalization_storage: "granted",
      security_storage: "granted",
    })

    // Create new script
    const script = document.createElement("script")
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}&t=${Date.now()}`

    script.onload = () => {
      // Configure GA4
      window.gtag("config", gaId, {
        send_page_view: true,
        page_title: document.title,
        page_location: window.location.href,
        transport_type: "beacon",
        cookie_domain: window.location.hostname,
        cookie_flags: "SameSite=Lax",
      })

      // Send events for activation
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

        // Force cookie creation through direct GA call
        window.gtag("event", "user_engagement", {
          engagement_time_msec: 1,
          send_to: gaId,
          transport_type: "beacon",
        })

        console.log("✅ Google Analytics force activation completed")
      }, 500)
    }

    script.onerror = () => {
      console.warn("Google Analytics script failed to load")
    }

    document.head.appendChild(script)

    // Additionally force cookie creation through iframe
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    iframe.src = `https://www.google-analytics.com/analytics.js?t=${Date.now()}`
    document.body.appendChild(iframe)
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1000)
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

    // Простіше очищення cookies при відкликанні згоди
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

    // Простіша активація GA
    if (consent.analytics && (!previousConsent || !previousConsent.analytics)) {
      setTimeout(activateGA, 100)
    }

    console.log("Consent saved:", consent)
  }

  // Додайте цю просту функцію очищення cookies:
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

  // Додайте цю просту функцію активації GA:
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

  const acceptAll = () => {
    console.log("🎯 Accept All clicked")
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
    console.log("🎯 Accept Necessary clicked")
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
    console.log("💾 Save Current Settings clicked")
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
