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
    marketingConsent: consent.marketing,
  })

  if (loading) {
    console.log("[v0] AnalyticsProvider still loading...")
    return null
  }

  return (
    <>
      {/* GTM завантажується завжди без умов - статуси керуються Consent Mode v2 */}
      {gtmId && (
        <>
          {console.log("[v0] Rendering GoogleTagManager")}
          <GoogleTagManager gtmId={gtmId} />
        </>
      )}
      {/* Facebook Pixel завантажується тільки при наявності consent */}
      {pixelId && (
        <>
          {console.log("[v0] Rendering FacebookPixel with consent:", consent.marketing)}
          <FacebookPixel pixelId={pixelId} consent={consent.marketing} />
        </>
      )}
    </>
  )
}

  return (
    <>
      {/* GTM завантажується завжди, без умов - статуси керуються Consent Mode v2 */}
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      {pixelId && <FacebookPixel pixelId={pixelId} consent={consent.marketing} />}
    </>
  )
}
