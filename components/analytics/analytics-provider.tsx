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
        console.log("🔄 Fetching analytics settings...")
        const response = await fetch("/api/admin/cookie-settings")

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("✅ Analytics settings loaded:", data)
        setSettings(data)
      } catch (error) {
        console.error("❌ Error fetching analytics settings:", error)
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

  useEffect(() => {
    if (hasInteracted) {
      console.log("🍪 Cookie consent status:")
      console.log("  Analytics:", consent.analytics ? "✅ GRANTED" : "❌ DENIED")
      console.log("  Marketing:", consent.marketing ? "✅ GRANTED" : "❌ DENIED")
      console.log("  Necessary:", consent.necessary ? "✅ GRANTED" : "❌ DENIED")
    }
  }, [consent, hasInteracted])

  useEffect(() => {
    if (settings && isLoaded) {
      console.log("📊 Analytics Provider Status:")
      console.log("  Settings loaded:", "✅")
      console.log("  GA4 ID:", settings.google_analytics_id || "❌ Not set")
      console.log("  Analytics consent:", consent.analytics ? "✅" : "❌")
      console.log("  Should load GA:", !!settings.google_analytics_id)

      if (settings.google_analytics_id) {
        if (consent.analytics) {
          console.log("🚀 GA will be active immediately!")
        } else {
          console.log("⏳ GA loaded but waiting for consent...")
        }
      } else {
        console.log("⚠️ Google Analytics ID not configured")
      }
    }
  }, [settings, isLoaded, consent])

  if (!isLoaded) {
    console.log("⏳ Analytics provider loading...")
    return null
  }

  if (!settings) {
    console.log("❌ No analytics settings available")
    return null
  }

  return (
    <>
      {/* Google Analytics - завантажується завжди, але активується тільки при згоді */}
      {settings.google_analytics_id && (
        <GoogleAnalytics gaId={settings.google_analytics_id} consent={consent.analytics} />
      )}

      {/* Google Tag Manager */}
      {settings.google_tag_manager_id && consent.analytics && (
        <GoogleTagManager gtmId={settings.google_tag_manager_id} consent={consent.analytics} />
      )}

      {/* Facebook Pixel */}
      {settings.facebook_pixel_id && consent.marketing && (
        <FacebookPixel pixelId={settings.facebook_pixel_id} consent={consent.marketing} />
      )}
    </>
  )
}
