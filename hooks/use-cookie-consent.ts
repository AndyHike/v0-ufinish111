"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { CookieConsent } from "@/types/cookie-consent"

interface CookieConsentContextType {
  consent: CookieConsent
  saveConsent: (newConsent: Partial<CookieConsent>) => void
  resetConsent: () => void
  hasConsented: boolean
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

const defaultConsent: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
  timestamp: null,
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent>(defaultConsent)
  const [hasConsented, setHasConsented] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("cookie-consent")
    if (stored) {
      try {
        const parsedConsent = JSON.parse(stored)
        setConsent(parsedConsent)
        setHasConsented(true)
      } catch (error) {
        // Invalid stored consent, use defaults
      }
    }
  }, [])

  const saveConsent = (newConsent: Partial<CookieConsent>) => {
    const updatedConsent = {
      ...consent,
      ...newConsent,
      timestamp: new Date().toISOString(),
    }

    setConsent(updatedConsent)
    setHasConsented(true)
    localStorage.setItem("cookie-consent", JSON.stringify(updatedConsent))

    // Активуємо Google Analytics якщо дозволено
    if (updatedConsent.analytics && typeof window !== "undefined") {
      setTimeout(() => {
        if (window.gtag) {
          window.gtag("consent", "update", {
            analytics_storage: "granted",
          })

          window.gtag("event", "page_view", {
            page_title: document.title,
            page_location: window.location.href,
            transport_type: "beacon",
          })

          window.gtag("event", "consent_granted", {
            event_category: "consent",
            event_label: "analytics_consent_granted",
            transport_type: "beacon",
          })
        }
      }, 100)
    }
  }

  const resetConsent = () => {
    setConsent(defaultConsent)
    setHasConsented(false)
    localStorage.removeItem("cookie-consent")
  }

  return (
    <CookieConsentContext.Provider value={{ consent, saveConsent, resetConsent, hasConsented }}>
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (context === undefined) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider")
  }
  return context
}
