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

  const saveConsent = (consent: CookieConsent) => {
    const consentData = {
      consent,
      consentDate: new Date().toISOString(),
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData))

    setState({
      consent,
      showBanner: false,
      hasInteracted: true,
      consentDate: consentData.consentDate,
    })

    // Додаємо невелику затримку для того, щоб React встиг оновити стан
    setTimeout(() => {
      // Тригеримо подію для оновлення аналітики
      window.dispatchEvent(
        new CustomEvent("cookieConsentChanged", {
          detail: { consent },
        }),
      )

      console.log("Cookie consent saved:", consent)
    }, 50)
  }

  const acceptAll = () => {
    const newConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
    }
    saveConsent(newConsent)
  }

  const acceptNecessary = () => {
    const newConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
    }
    saveConsent(newConsent)
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
    saveConsent(state.consent)
  }

  const setShowBanner = (show: boolean) => {
    setState((prev) => ({ ...prev, showBanner: show }))
  }

  // Функція для скидання всіх налаштувань cookies
  const resetConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY)
    setState({
      consent: {
        necessary: true,
        analytics: false,
        marketing: false,
      },
      showBanner: true,
      hasInteracted: false,
      consentDate: null,
    })

    // Тригеримо подію для оновлення аналітики
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("cookieConsentChanged", {
          detail: {
            consent: {
              necessary: true,
              analytics: false,
              marketing: false,
            },
          },
        }),
      )
    }, 50)
  }

  return {
    ...state,
    acceptAll,
    acceptNecessary,
    updateCategory,
    saveCurrentSettings,
    setShowBanner,
    resetConsent,
  }
}
