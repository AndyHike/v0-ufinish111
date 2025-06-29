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
  const [settingsError, setSettingsError] = useState<string | null>(null)
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
        setSettingsError(null)
      } catch (error) {
        console.warn("Failed to fetch analytics settings:", error)
        setSettingsError(error instanceof Error ? error.message : "Unknown error")

        // Set default settings with your Facebook Pixel ID
        setSettings({
          google_analytics_id: "",
          google_tag_manager_id: "",
          facebook_pixel_id: "1823195131746594", // Your Facebook Pixel ID
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

  // Log consent changes for debugging
  useEffect(() => {
    if (hasInteracted && process.env.NODE_ENV === "development") {
      console.log("Analytics consent status:", {
        analytics: consent.analytics,
        marketing: consent.marketing,
        settings: settings
          ? {
              ga_id: settings.google_analytics_id ? "Set" : "Not set",
              gtm_id: settings.google_tag_manager_id ? "Set" : "Not set",
              fb_pixel_id: settings.facebook_pixel_id ? "Set" : "Not set",
            }
          : "Loading...",
        settingsError,
      })
    }
  }, [consent, hasInteracted, settings, settingsError])

  // Log when analytics services are being loaded
  useEffect(() => {
    if (isLoaded && settings && process.env.NODE_ENV === "development") {
      const services = []
      if (settings.google_analytics_id && consent.analytics) services.push("Google Analytics")
      if (settings.google_tag_manager_id && consent.analytics) services.push("Google Tag Manager")
      if (settings.facebook_pixel_id && consent.marketing) services.push("Facebook Pixel")

      if (services.length > 0) {
        console.log(`Loading analytics services: ${services.join(", ")}`)
      }
    }
  }, [isLoaded, settings, consent])

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

      {settings.facebook_pixel_id && <FacebookPixel pixelId={settings.facebook_pixel_id} consent={consent.marketing} />}
    </>
  )
}
