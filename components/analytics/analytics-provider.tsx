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
        const response = await fetch("/api/admin/cookie-settings")
        if (response.ok) {
          const data = await response.json()
          console.log("Analytics settings loaded:", data)
          setSettings(data)
        } else {
          console.error("Failed to fetch analytics settings")
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
  }, [consent])

  if (!isLoaded || !settings) {
    return null
  }

  return (
    <>
      {/* Google Analytics - завантажується тільки при згоді на аналітику */}
      {settings.google_analytics_id && (
        <GoogleAnalytics gaId={settings.google_analytics_id} consent={consent.analytics} />
      )}

      {/* Google Tag Manager - завантажується тільки при згоді на аналітику */}
      {settings.google_tag_manager_id && (
        <GoogleTagManager gtmId={settings.google_tag_manager_id} consent={consent.analytics} />
      )}

      {/* Facebook Pixel - завантажується тільки при згоді на маркетинг */}
      {settings.facebook_pixel_id && <FacebookPixel pixelId={settings.facebook_pixel_id} consent={consent.marketing} />}
    </>
  )
}
