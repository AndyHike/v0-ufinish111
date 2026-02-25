"use client"

import { FacebookPixel } from "./facebook-pixel"
import { useCookieConsentContext } from "@/contexts/cookie-consent-context"
import { GoogleTagManager } from "./google-tag-manager"
import { useAnalyticsSettings } from "@/hooks/use-analytics-settings"

export function AnalyticsProvider() {
  const { consent } = useCookieConsentContext()
  const { gtmId, pixelId, loading } = useAnalyticsSettings()

  if (loading) {
    return null
  }

  return (
    <>
      {/* GTM завантажується завжди, без умов - статуси керуються Consent Mode v2 */}
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      {pixelId && <FacebookPixel pixelId={pixelId} consent={consent.marketing} />}
    </>
  )
}
