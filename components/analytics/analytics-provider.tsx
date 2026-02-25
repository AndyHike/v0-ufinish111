"use client"

import { FacebookPixel } from "./facebook-pixel"
import { useCookieConsentContext } from "@/contexts/cookie-consent-context"
import { GoogleTagManager } from "./google-tag-manager"
import { useAnalyticsSettings } from "@/hooks/use-analytics-settings"

export function AnalyticsProvider() {
  const { consent } = useCookieConsentContext()
  const { gtmId, pixelId, loading } = useAnalyticsSettings()

  console.log("[v0] AnalyticsProvider render:", { 
    loading, 
    gtmId: gtmId ? "SET" : "NOT_SET", 
    pixelId: pixelId ? "SET" : "NOT_SET",
    marketingConsent: consent.marketing 
  })

  if (loading) {
    console.log("[v0] AnalyticsProvider: Still loading, returning null")
    return null
  }

  console.log("[v0] AnalyticsProvider: Rendering GTM and Facebook Pixel")

  return (
    <>
      {/* GTM завантажується завжди, без умов - статуси керуються Consent Mode v2 */}
      {gtmId ? (
        <>
          {console.log("[v0] Rendering GoogleTagManager with ID:", gtmId.substring(0, 10))}
          <GoogleTagManager gtmId={gtmId} />
        </>
      ) : (
        console.log("[v0] GTM ID not set")
      )}
      {pixelId ? (
        <>
          {console.log("[v0] Rendering FacebookPixel with ID:", pixelId, "consent:", consent.marketing)}
          <FacebookPixel pixelId={pixelId} consent={consent.marketing} />
        </>
      ) : (
        console.log("[v0] Pixel ID not set")
      )}
    </>
  )
}
