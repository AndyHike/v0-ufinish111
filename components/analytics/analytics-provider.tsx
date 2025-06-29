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
  const [isLoaded, setIsLoaded] = useState(false)
  const { consent, hasInteracted } = useCookieConsent()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/cookie-settings")

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setSettings(data)
      } catch (error) {
        setSettings({
          google_analytics_id: "",
          google_tag_manager_id: "",
          facebook_pixel_id: "",
          cookie_banner_enabled: true,
          analytics_enabled: true,
          marketing_enabled: true,
        })
      } finally {
        setIsLoaded(true)
      }
    }

    fetchSettings()
  }, [])

  if (!isLoaded) {
    return null
  }

  if (!settings) {
    return null
  }

  return (
    <>
      {settings.google_analytics_id && (
        <GoogleAnalytics gaId={settings.google_analytics_id} consent={consent.analytics} />
      )}

      {settings.google_tag_manager_id && consent.analytics && (
        <GoogleTagManager gtmId={settings.google_tag_manager_id} consent={consent.analytics} />
      )}

      {settings.facebook_pixel_id && consent.marketing && (
        <FacebookPixel pixelId={settings.facebook_pixel_id} consent={consent.marketing} />
      )}
    </>
  )
}
