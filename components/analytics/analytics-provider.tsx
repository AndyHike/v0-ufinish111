"use client"

import { FacebookPixel } from "./facebook-pixel"
import { useCookieConsentContext } from "@/contexts/cookie-consent-context"
import { GoogleTagManager } from "./google-tag-manager"

export function AnalyticsProvider() {
  const { consent } = useCookieConsentContext()
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  return (
    <>
      {/* GTM завантажується завжди, без умов - статуси керуються Consent Mode v2 */}
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      {pixelId && <FacebookPixel pixelId={pixelId} consent={consent.marketing} />}
    </>
  )
}
