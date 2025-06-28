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

  useEffect(() => {
    console.log("🍪 Initializing cookie consent...")

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
          console.log("✅ Existing consent loaded:", parsed.consent)
        } else {
          setState((prev) => ({ ...prev, showBanner: true }))
          console.log("⏰ Consent expired, showing banner")
        }
      } catch (error) {
        console.error("❌ Error parsing cookie consent:", error)
        setState((prev) => ({ ...prev, showBanner: true }))
      }
    } else {
      setState((prev) => ({ ...prev, showBanner: true }))
      console.log("🆕 No existing consent, showing banner")
    }
  }, [])

  const saveConsent = (consent: CookieConsent) => {
    const consentData = {
      consent,
      consentDate: new Date().toISOString(),
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData))

    // Оновлюємо стан
    setState({
      consent,
      showBanner: false,
      hasInteracted: true,
      consentDate: consentData.consentDate,
    })

    console.log("💾 Consent saved:", consent)

    if (consent.analytics) {
      console.log("🚀 Analytics consent granted - triggering immediate activation!")

      // Додаємо невелику затримку для того щоб React встиг оновити стан
      setTimeout(() => {
        // Перевіряємо чи GA доступний і відправляємо дані
        if (typeof window !== "undefined" && window.gtag) {
          console.log("⚡ Sending immediate analytics data...")

          // Оновлюємо consent в GA
          window.gtag("consent", "update", {
            analytics_storage: "granted",
          })

          // Відправляємо page_view
          window.gtag("event", "page_view", {
            page_title: document.title,
            page_location: window.location.href,
            transport_type: "beacon",
          })

          // Відправляємо подію про надання згоди
          window.gtag("event", "consent_granted_immediate", {
            event_category: "consent",
            event_label: "user_accepted_analytics",
            transport_type: "beacon",
          })

          // Відправляємо engagement подію
          window.gtag("event", "user_engagement", {
            engagement_time_msec: 1000,
            transport_type: "beacon",
          })

          console.log("✅ Immediate analytics data sent!")
        } else {
          console.log("⏳ GA not ready yet, will be handled by GoogleAnalytics component")
        }
      }, 100)
    } else {
      console.log("🔒 Analytics consent denied")
    }

    if (consent.marketing) {
      console.log("📢 Marketing consent granted")
    } else {
      console.log("🔒 Marketing consent denied")
    }
  }

  const acceptAll = () => {
    console.log("✅ User accepted all cookies")
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    })
  }

  const acceptNecessary = () => {
    console.log("🔒 User accepted only necessary cookies")
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    })
  }

  const updateCategory = (category: keyof CookieConsent, value: boolean) => {
    setState((prev) => ({
      ...prev,
      consent: {
        ...prev.consent,
        [category]: category === "necessary" ? true : value,
      },
    }))
    console.log(`🔄 Updated ${category} consent to:`, value)
  }

  const saveCurrentSettings = () => {
    console.log("💾 Saving current cookie settings:", state.consent)
    saveConsent(state.consent)
  }

  const setShowBanner = (show: boolean) => {
    setState((prev) => ({ ...prev, showBanner: show }))
    console.log("🏷️ Banner visibility:", show ? "shown" : "hidden")
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
