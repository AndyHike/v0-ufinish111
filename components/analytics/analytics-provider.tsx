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
        console.log("📊 Analytics settings loaded:", data)
        setSettings(data)
      } catch (error) {
        console.warn("⚠️ Failed to load analytics settings, using defaults:", error)
        setSettings({
          google_analytics_id: "",
          google_tag_manager_id: "",
          facebook_pixel_id: "1823195131746594", // Ваш Pixel ID як fallback
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

  // Логування змін згоди
  useEffect(() => {
    console.log("🔄 Analytics Provider - Consent changed:", consent)
  }, [consent])

  if (!isLoaded) {
    console.log("⏳ Analytics Provider - Settings not loaded yet")
    return null
  }

  if (!settings) {
    console.log("❌ Analytics Provider - No settings available")
    return null
  }

  console.log("🚀 Analytics Provider - Rendering components:", {
    googleAnalytics: !!settings.google_analytics_id,
    googleTagManager: !!settings.google_tag_manager_id,
    facebookPixel: !!settings.facebook_pixel_id,
    consent,
  })

  return (
    <>
      {settings.google_analytics_id && (
        <GoogleAnalytics gaId={settings.google_analytics_id} consent={consent.analytics} />
      )}

      {settings.google_tag_manager_id && consent.analytics && (
        <GoogleTagManager gtmId={settings.google_tag_manager_id} consent={consent.analytics} />
      )}

      {settings.facebook_pixel_id && <FacebookPixel pixelId={settings.facebook_pixel_id} consent={consent.marketing} />}
    </>
  )
}
