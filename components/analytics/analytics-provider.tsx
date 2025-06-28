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
  const { consent } = useCookieConsent()

  useEffect(() => {
    // Завантажуємо налаштування аналітики
    const fetchSettings = async () => {
      try {
        console.log("Fetching analytics settings...")
        const response = await fetch("/api/admin/cookie-settings")
        if (response.ok) {
          const data = await response.json()
          console.log("Analytics settings loaded:", data)
          setSettings(data)
        } else {
          console.error("Failed to fetch analytics settings, status:", response.status)
        }
      } catch (error) {
        console.error("Error fetching analytics settings:", error)
      } finally {
        setIsLoaded(true)
      }
    }

    fetchSettings()
  }, [])

  // Логування стану consent
  useEffect(() => {
    console.log("Cookie consent state:", consent)
    console.log("Analytics consent:", consent.analytics)
    console.log("Marketing consent:", consent.marketing)

    if (!consent.analytics) {
      console.log("⚠️ Analytics consent is FALSE - Google Analytics will NOT load")
      console.log("💡 Accept analytics cookies to enable Google Analytics")
    }
  }, [consent])

  // Логування налаштувань
  useEffect(() => {
    if (settings) {
      console.log("Current analytics settings:", {
        gaId: settings.google_analytics_id,
        gtmId: settings.google_tag_manager_id,
        fbPixelId: settings.facebook_pixel_id,
        analyticsConsent: consent.analytics,
        marketingConsent: consent.marketing,
      })

      // Перевіряємо чи повинен завантажуватися GA
      const shouldLoadGA = consent.analytics && settings.google_analytics_id
      console.log("Should load Google Analytics:", shouldLoadGA)

      if (settings.google_analytics_id && !consent.analytics) {
        console.log("🔒 Google Analytics ID is set but consent is denied")
      }
    }
  }, [settings, consent])

  if (!isLoaded) {
    console.log("Analytics provider not loaded yet")
    return null
  }

  if (!settings) {
    console.log("No analytics settings found")
    return null
  }

  return (
    <>
      {/* Google Analytics - завантажується тільки при згоді на аналітику */}
      {settings.google_analytics_id && consent.analytics && (
        <GoogleAnalytics gaId={settings.google_analytics_id} consent={consent.analytics} />
      )}

      {/* Google Tag Manager - завантажується тільки при згоді на аналітику */}
      {settings.google_tag_manager_id && consent.analytics && (
        <GoogleTagManager gtmId={settings.google_tag_manager_id} consent={consent.analytics} />
      )}

      {/* Facebook Pixel - завантажується тільки при згоді на маркетинг */}
      {settings.facebook_pixel_id && consent.marketing && (
        <FacebookPixel pixelId={settings.facebook_pixel_id} consent={consent.marketing} />
      )}
    </>
  )
}
