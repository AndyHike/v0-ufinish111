"use client"

import type { ReactNode } from "react"
import { GoogleAnalytics } from "./google-analytics"
import { GoogleTagManager } from "./google-tag-manager"
import { FacebookPixel } from "./facebook-pixel"
import { useCookieConsent } from "@/hooks/use-cookie-consent"

/**
 * Глобальний провайдер аналітики.
 * Рендерить потрібні скрипти лише після надання згоди користувача.
 */
interface AnalyticsProviderProps {
  googleAnalyticsId?: string
  googleTagManagerId?: string
  facebookPixelId?: string
  children: ReactNode
}

export function AnalyticsProvider({
  googleAnalyticsId,
  googleTagManagerId,
  facebookPixelId,
  children,
}: AnalyticsProviderProps) {
  const { consent } = useCookieConsent()

  return (
    <>
      {googleAnalyticsId && <GoogleAnalytics gaId={googleAnalyticsId} consent={consent.analytics} />}

      {googleTagManagerId && <GoogleTagManager containerId={googleTagManagerId} consent={consent.analytics} />}

      {facebookPixelId && <FacebookPixel pixelId={facebookPixelId} consent={consent.marketing} />}

      {children}
    </>
  )
}
