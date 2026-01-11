"use client"

import { FacebookPixel } from "./facebook-pixel"
import { GoogleTag } from "./google-tag"
import { useCookieConsentContext } from "@/contexts/cookie-consent-context"

export function AnalyticsProvider() {
  const { consent } = useCookieConsentContext()
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  const googleTagId = "AW-17499950988" // Google Ads conversion tracking ID

  return (
    <>
      <GoogleTag tagId={googleTagId} consent={consent.analytics} />
      {pixelId && <FacebookPixel pixelId={pixelId} consent={consent.marketing} />}
    </>
  )
}
