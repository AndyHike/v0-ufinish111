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

  // Функція для очищення всіх GA cookies
  const clearGACookies = () => {
    if (typeof document === "undefined") return

    // Список всіх можливих GA cookies
    const gaCookies = [
      "_ga",
      "_ga_" + (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").replace("G-", ""),
      "_gid",
      "_gat",
      "_gat_gtag_" + (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").replace("G-", ""),
      "__utma",
      "__utmb",
      "__utmc",
      "__utmt",
      "__utmz",
    ]

    // Видаляємо cookies для всіх доменів
    const domains = [window.location.hostname, "." + window.location.hostname, ".devicehelp.cz", "devicehelp.cz"]

    gaCookies.forEach((cookieName) => {
      domains.forEach((domain) => {
        // Видаляємо cookie
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })
    })

    console.log("GA cookies cleared")
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
          // Згода застаріла - очищуємо cookies
          clearGACookies()
          setState((prev) => ({ ...prev, showBanner: true }))
        }
      } catch (error) {
        clearGACookies()
        setState((prev) => ({ ...prev, showBanner: true }))
      }
    } else {
      // Немає збереженої згоди - очищуємо cookies
      clearGACookies()
      setState((prev) => ({ ...prev, showBanner: true }))
    }
  }, [])

  const saveConsent = (consent: CookieConsent) => {
    const consentData = {
      consent,
      consentDate: new Date().toISOString(),
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData))

    // Якщо аналітика відключена - очищуємо cookies
    if (!consent.analytics) {
      clearGACookies()
    }

    setState({
      consent,
      showBanner: false,
      hasInteracted: true,
      consentDate: consentData.consentDate,
    })

    console.log("Cookie consent saved:", consent)
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
    // Очищуємо всі GA cookies
    clearGACookies()

    // Видаляємо збережені налаштування
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

    console.log("Cookie consent reset and GA cookies cleared")
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
