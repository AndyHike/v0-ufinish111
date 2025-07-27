"use client"

import type { ReactNode } from "react"
import { FacebookPixel } from "./facebook-pixel"
import { GoogleAnalytics } from "./google-analytics"
import { useCookieConsent } from "@/hooks/use-cookie-consent"

interface AnalyticsProviderProps {
  children: ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { consent } = useCookieConsent()

  const facebookPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

  return (
    <>
      {children}
      {facebookPixelId && <FacebookPixel pixelId={facebookPixelId} consent={consent.marketing} />}
      {googleAnalyticsId && <GoogleAnalytics gaId={googleAnalyticsId} consent={consent.marketing} />}
    </>
  )
}
