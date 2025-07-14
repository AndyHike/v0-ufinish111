"use client"

import { useEffect, useState } from "react"
import { GoogleAnalytics } from "./google-analytics"
import { GoogleTagManager } from "./google-tag-manager"
import { FacebookPixel } from "./facebook-pixel"
import { useCookieConsent } from "@/hooks/use-cookie-consent"

interface AnalyticsSettings {
  google_analytics_id: string
  google_tag_manager_id: string
  facebook_pixel_id: string
  cookie_banner_enabled: boolean
  analytics_enabled: boolean
  marketing_enabled: boolean
}

export function AnalyticsProvider() {
  const [settings, setSettings] = useState<AnalyticsSettings | null>(null)
  const { consent } = useCookieConsent()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/cookie-settings")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        } else {
          setSettings({
            google_analytics_id: "",
            google_tag_manager_id: "",
            facebook_pixel_id: "1823195131746594",
            cookie_banner_enabled: true,
            analytics_enabled: true,
            marketing_enabled: true,
          })
        }
      } catch (error) {
        console.warn("Failed to load analytics settings:", error)
        setSettings({
          google_analytics_id: "",
          google_tag_manager_id: "",
          facebook_pixel_id: "1823195131746594",
          cookie_banner_enabled: true,
          analytics_enabled: true,
          marketing_enabled: true,
        })
      }
    }

    fetchSettings()
  }, [])

  if (!settings) return null

  return (
    <>
      {settings.google_analytics_id && consent.analytics && (
        <GoogleAnalytics gaId={settings.google_analytics_id} consent={consent.analytics} />
      )}

      {settings.google_tag_manager_id && consent.analytics && (
        <GoogleTagManager gtmId={settings.google_tag_manager_id} consent={consent.analytics} />
      )}

      {settings.facebook_pixel_id && <FacebookPixel pixelId={settings.facebook_pixel_id} consent={consent.marketing} />}
    </>
  )
}
