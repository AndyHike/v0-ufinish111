"use client"

import { useEffect, useState } from "react"
import { GoogleAnalytics } from "./google-analytics"
import { GoogleTagManager } from "./google-tag-manager"
import { FacebookPixel } from "./facebook-pixel"
import { useCookieConsent } from "@/hooks/use-cookie-consent"

interface CookieSettings {
  google_analytics_id: string
  google_tag_manager_id: string
  facebook_pixel_id: string
  cookie_banner_enabled: boolean
  analytics_enabled: boolean
  marketing_enabled: boolean
}

export function AnalyticsProvider() {
  const [settings, setSettings] = useState<CookieSettings | null>(null)
  const { consent } = useCookieConsent()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/cookie-settings")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Error fetching cookie settings:", error)
      }
    }

    fetchSettings()
  }, [])

  if (!settings) return null

  const shouldLoadAnalytics = consent.analytics && settings.google_analytics_id
  const shouldLoadGTM = consent.analytics && settings.google_tag_manager_id
  const shouldLoadFacebookPixel = consent.marketing && settings.facebook_pixel_id

  return (
    <>
      {shouldLoadAnalytics && <GoogleAnalytics measurementId={settings.google_analytics_id} />}
      {shouldLoadGTM && <GoogleTagManager containerId={settings.google_tag_manager_id} />}
      {shouldLoadFacebookPixel && <FacebookPixel pixelId={settings.facebook_pixel_id} />}
    </>
  )
}
