"use client"

import { FacebookPixel } from "./facebook-pixel"
import { useCookieConsentContext } from "@/contexts/cookie-consent-context"

export function AnalyticsProvider() {
  const { consent } = useCookieConsentContext()
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

  console.log("🔄 AnalyticsProvider render:", { pixelId, marketingConsent: consent.marketing })

  if (!pixelId) {
    console.warn("⚠️ NEXT_PUBLIC_FACEBOOK_PIXEL_ID not found")
    return null
  }

  return <FacebookPixel pixelId={pixelId} consent={consent.marketing} />
}
