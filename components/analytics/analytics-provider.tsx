"use client"

import { GoogleTagManager } from "./google-tag-manager"

export function AnalyticsProvider() {
  return (
    <>
      {/* Google Ads Tag - завантажується завжди з Consent Mode v2 ініціалізацією */}
      <GoogleTagManager />
      {/* Facebook Pixel - буде реалізовано пізніше */}
    </>
  )
}
