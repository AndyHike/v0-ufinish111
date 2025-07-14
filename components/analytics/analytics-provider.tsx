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
  const [pixelId, setPixelId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const { consent } = useCookieConsent()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log("🔄 Fetching analytics settings...")
        const response = await fetch("/api/admin/cookie-settings")

        if (response.ok) {
          const data = await response.json()
          console.log("📊 Analytics settings loaded:", data)

          if (data.facebook_pixel_id) {
            setPixelId(data.facebook_pixel_id)
            console.log("✅ Facebook Pixel ID set:", data.facebook_pixel_id)
          } else {
            console.warn("⚠️ No Facebook Pixel ID in settings")
          }
        } else {
          console.error("❌ Failed to fetch analytics settings:", response.status)
        }
      } catch (error) {
        console.error("❌ Error fetching analytics settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Не рендеримо FacebookPixel поки не завантажили налаштування
  if (isLoading || !pixelId) {
    console.log("⏳ Waiting for pixel ID...", { isLoading, pixelId })
    return null
  }

  console.log("🚀 Rendering FacebookPixel with ID:", pixelId, "Consent:", consent.marketing)

  return <FacebookPixel pixelId={pixelId} consent={consent.marketing} />
}
