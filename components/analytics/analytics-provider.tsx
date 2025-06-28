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
    // Завантажуємо налаштування аналітики
    const fetchSettings = async () => {
      try {
        console.log("🔄 Fetching analytics settings...")
        const response = await fetch("/api/admin/cookie-settings")
        if (response.ok) {
          const data = await response.json()
          console.log("✅ Analytics settings loaded:", data)
          setSettings(data)
        } else {
          console.error("❌ Failed to fetch analytics settings, status:", response.status)
        }
      } catch (error) {
        console.error("❌ Error fetching analytics settings:", error)
      } finally {
        setIsLoaded(true)
      }
    }

    fetchSettings()
  }, [])

  // Логування стану consent при зміні
  useEffect(() => {
    if (hasInteracted) {
      console.log("🍪 Cookie consent state updated:")
      console.log("  - Analytics:", consent.analytics ? "✅ ACCEPTED" : "❌ DENIED")
      console.log("  - Marketing:", consent.marketing ? "✅ ACCEPTED" : "❌ DENIED")
      console.log("  - Necessary:", consent.necessary ? "✅ ACCEPTED" : "❌ DENIED")

      if (settings?.google_analytics_id) {
        if (consent.analytics) {
          console.log("🚀 Google Analytics will be activated!")
        } else {
          console.log("🔒 Google Analytics blocked by user consent")
        }
      }
    }
  }, [consent, hasInteracted, settings])

  // Логування налаштувань при завантаженні
  useEffect(() => {
    if (settings && isLoaded) {
      console.log("⚙️ Analytics configuration:")
      console.log("  - GA4 ID:", settings.google_analytics_id || "Not configured")
      console.log("  - GTM ID:", settings.google_tag_manager_id || "Not configured")
      console.log("  - FB Pixel:", settings.facebook_pixel_id || "Not configured")
      console.log("  - Cookie Banner:", settings.cookie_banner_enabled ? "Enabled" : "Disabled")
    }
  }, [settings, isLoaded])

  if (!isLoaded) {
    console.log("⏳ Analytics provider loading...")
    return null
  }

  if (!settings) {
    console.log("⚠️ No analytics settings found")
    return null
  }

  return (
    <>
      {/* Google Analytics - активується динамічно при згоді */}
      {settings.google_analytics_id && (
        <GoogleAnalytics gaId={settings.google_analytics_id} consent={consent.analytics} />
      )}

      {/* Google Tag Manager - активується динамічно при згоді */}
      {settings.google_tag_manager_id && consent.analytics && (
        <GoogleTagManager gtmId={settings.google_tag_manager_id} consent={consent.analytics} />
      )}

      {/* Facebook Pixel - активується динамічно при згоді */}
      {settings.facebook_pixel_id && consent.marketing && (
        <FacebookPixel pixelId={settings.facebook_pixel_id} consent={consent.marketing} />
      )}
    </>
  )
}
