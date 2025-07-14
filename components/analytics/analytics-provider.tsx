"use client"

import { FacebookPixel } from "./facebook-pixel"
import { useCookieConsent } from "@/hooks/use-cookie-consent"

export function AnalyticsProvider() {
  const { consent } = useCookieConsent()
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "1707859576556389"

  console.log("🔄 AnalyticsProvider:", { pixelId, consent: consent.marketing })

  return <FacebookPixel pixelId={pixelId} consent={consent.marketing} />
}
