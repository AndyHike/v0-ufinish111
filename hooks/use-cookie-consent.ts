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

    // Розширений список всіх можливих GA cookies
    const gaCookies = [
      "_ga",
      "_ga_WZ0WCHZ3XT", // Конкретний cookie який згадував користувач
      "_gid",
      "_gat",
      "_gat_gtag_G_WZ0WCHZ3XT",
      "__utma",
      "__utmb",
      "__utmc",
      "__utmt",
      "__utmz",
      "_gcl_au",
    ]

    // Додаємо динамічні GA cookies на основі measurement ID
    const measurementIds = [
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      "WZ0WCHZ3XT", // Конкретний ID
    ].filter(Boolean)

    measurementIds.forEach((id) => {
      if (id) {
        const cleanId = id.replace("G-", "")
        gaCookies.push(`_ga_${cleanId}`)
        gaCookies.push(`_gat_gtag_G_${cleanId}`)
      }
    })

    // Домени та шляхи для очищення
    const domains = ["", window.location.hostname, "." + window.location.hostname, ".devicehelp.cz", "devicehelp.cz"]
    const paths = ["/", "/admin", "/auth"]

    console.log("Clearing GA cookies:", gaCookies)

    gaCookies.forEach((cookieName) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
          if (domain) {
            document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=${domain}; SameSite=Lax`
            document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=${domain}; SameSite=None; Secure`
          }
          document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; SameSite=Lax`
          document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; SameSite=None; Secure`
        })
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

    // Якщо аналітика відключена - очищуємо cookies НЕГАЙНО
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

    // Тригеримо подію для негайного оновлення аналітики
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cookieConsentChanged", {
          detail: { consent, immediate: true },
        }),
      )
    }
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
    // Очищуємо всі GA cookies НЕГАЙНО
    clearGACookies()

    // Видаляємо збережені налаштування
    localStorage.removeItem(COOKIE_CONSENT_KEY)

    const resetState = {
      consent: {
        necessary: true,
        analytics: false,
        marketing: false,
      },
      showBanner: true,
      hasInteracted: false,
      consentDate: null,
    }

    setState(resetState)

    // Тригеримо подію для негайного оновлення аналітики
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cookieConsentChanged", {
          detail: { consent: resetState.consent, immediate: true, reset: true },
        }),
      )
    }

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
