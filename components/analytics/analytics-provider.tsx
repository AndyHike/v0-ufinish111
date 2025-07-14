"use client"

import { FacebookPixel } from "./facebook-pixel"
import { useCookieConsentContext } from "@/contexts/cookie-consent-context"

export function AnalyticsProvider() {
  const { consent } = useCookieConsentContext()
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "1707859576556389"

  console.log("🔄 AnalyticsProvider:", { pixelId, consent: consent.marketing })

  return <FacebookPixel pixelId={pixelId} consent={consent.marketing} />
}
