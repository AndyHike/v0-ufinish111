"use client"

import { useEffect, useState } from "react"
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
  const [settings, setSettings] = useState<AnalyticsSettings>({
    google_analytics_id: "",
    google_tag_manager_id: "",
    facebook_pixel_id: "1707859576556389", // Fallback ID
    cookie_banner_enabled: true,
    analytics_enabled: true,
    marketing_enabled: true,
  })
  const { consent } = useCookieConsent()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/cookie-settings")
        if (response.ok) {
          const data = await response.json()
          setSettings((prev) => ({
            ...prev,
            ...data,
            // Якщо facebook_pixel_id порожній, використовуємо fallback
            facebook_pixel_id: data.facebook_pixel_id || "1707859576556389",
          }))
        }
      } catch (error) {
        console.warn("Failed to load analytics settings:", error)
        // Використовуємо fallback налаштування при помилці
      }
    }

    fetchSettings()
  }, [])

  return (
    <>
      {/* Facebook Pixel завжди рендериться, але працює тільки при згоді */}
      <FacebookPixel pixelId={settings.facebook_pixel_id} consent={consent.marketing} />
    </>
  )
}
