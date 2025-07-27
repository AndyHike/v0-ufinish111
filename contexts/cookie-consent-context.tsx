"use client"

import type React from "react"
import { createContext, useContext, useEffect } from "react"
import { useCookieConsent } from "@/hooks/use-cookie-consent"
import type { CookieConsent } from "@/types/cookie-consent"

interface CookieConsentContextType {
  consent: CookieConsent
  showBanner: boolean
  hasInteracted: boolean
  consentDate: string | null
  acceptAll: () => void
  acceptNecessary: () => void
  updateCategory: (category: keyof CookieConsent, value: boolean) => void
  saveCurrentSettings: () => void
  setShowBanner: (show: boolean) => void
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const cookieConsent = useCookieConsent()

  // Логування змін consent для діагностики
  useEffect(() => {
    console.log("🔄 CookieConsentProvider - consent changed:", cookieConsent.consent)
  }, [cookieConsent.consent])

  return <CookieConsentContext.Provider value={cookieConsent}>{children}</CookieConsentContext.Provider>
}

export function useCookieConsentContext() {
  const context = useContext(CookieConsentContext)
  if (context === undefined) {
    throw new Error("useCookieConsentContext must be used within a CookieConsentProvider")
  }
  return context
}
