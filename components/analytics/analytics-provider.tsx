"use client"

import type React from "react"

import { useEffect } from "react"
import { useCookieConsent } from "@/hooks/use-cookie-consent"
import { GoogleAnalytics } from "./google-analytics"
import { GoogleTagManager } from "./google-tag-manager"
import { FacebookPixel } from "./facebook-pixel"

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { consent } = useCookieConsent()

  useEffect(() => {
    // Only load analytics if user has consented
    if (!consent?.analytics) return

    // Initialize analytics without debug logging
  }, [consent])

  if (!consent?.analytics) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <GoogleAnalytics />
      <GoogleTagManager />
      <FacebookPixel />
    </>
  )
}
