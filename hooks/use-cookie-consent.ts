"use client"

import { useState, useEffect, useCallback } from "react"
import type { CookieConsent, CookieCategory } from "@/types/cookie-consent"

const COOKIE_CONSENT_KEY = "cookie-consent"
const CONSENT_VERSION = "1.0"

const defaultConsent: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: 0,
  version: CONSENT_VERSION,
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent>(defaultConsent)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  // Load consent from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (stored) {
        const parsedConsent = JSON.parse(stored) as CookieConsent

        // Check if consent is still valid (not older than 1 year)
        const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000
        const isExpired = parsedConsent.timestamp < oneYearAgo
        const isOldVersion = parsedConsent.version !== CONSENT_VERSION

        if (isExpired || isOldVersion) {
          setShowBanner(true)
          setConsent(defaultConsent)
        } else {
          setConsent(parsedConsent)
          setShowBanner(false)
        }
      } else {
        setShowBanner(true)
      }
    } catch (error) {
      console.error("Error loading cookie consent:", error)
      setShowBanner(true)
    }
    setIsLoaded(true)
  }, [])

  // Save consent to localStorage
  const saveConsent = useCallback(
    (newConsent: Partial<CookieConsent>) => {
      const updatedConsent: CookieConsent = {
        ...consent,
        ...newConsent,
        necessary: true, // Always true
        timestamp: Date.now(),
        version: CONSENT_VERSION,
      }

      setConsent(updatedConsent)
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(updatedConsent))
      setShowBanner(false)

      // Trigger custom event for script loading
      window.dispatchEvent(
        new CustomEvent("cookieConsentUpdated", {
          detail: updatedConsent,
        }),
      )
    },
    [consent],
  )

  const acceptAll = useCallback(() => {
    saveConsent({
      analytics: true,
      marketing: true,
    })
  }, [saveConsent])

  const acceptNecessary = useCallback(() => {
    saveConsent({
      analytics: false,
      marketing: false,
    })
  }, [saveConsent])

  const updateCategory = useCallback(
    (category: CookieCategory, value: boolean) => {
      if (category === "necessary") return // Can't change necessary cookies

      saveConsent({
        [category]: value,
      })
    },
    [saveConsent],
  )

  const resetConsent = useCallback(() => {
    localStorage.removeItem(COOKIE_CONSENT_KEY)
    setConsent(defaultConsent)
    setShowBanner(true)
  }, [])

  return {
    consent,
    isLoaded,
    showBanner,
    acceptAll,
    acceptNecessary,
    updateCategory,
    resetConsent,
    setShowBanner,
  }
}
