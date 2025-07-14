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
  const [pixelId, setPixelId] = useState("1707859576556389") // Ваш новий ID
  const { consent } = useCookieConsent()

  useEffect(() => {
    fetch("/api/admin/cookie-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.facebook_pixel_id) {
          setPixelId(data.facebook_pixel_id)
        }
      })
      .catch(() => {
        // Використовуємо fallback ID при помилці
      })
  }, [])

  return (
    <>
      <FacebookPixel pixelId={pixelId} consent={consent.marketing} />
    </>
  )
}
