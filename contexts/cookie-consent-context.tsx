"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useCookieConsent } from "@/hooks/use-cookie-consent"
import type { CookieConsent, CookieCategory } from "@/types/cookie-consent"

interface CookieConsentContextType {
  consent: CookieConsent
  isLoaded: boolean
  showBanner: boolean
  acceptAll: () => void
  acceptNecessary: () => void
  updateCategory: (category: CookieCategory, value: boolean) => void
  resetConsent: () => void
  setShowBanner: (show: boolean) => void
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const cookieConsent = useCookieConsent()

  return <CookieConsentContext.Provider value={cookieConsent}>{children}</CookieConsentContext.Provider>
}

export function useCookieConsentContext() {
  const context = useContext(CookieConsentContext)
  if (context === undefined) {
    throw new Error("useCookieConsentContext must be used within a CookieConsentProvider")
  }
  return context
}
