"use client"

import { useEffect, useState } from "react"
import { GoogleAnalytics } from "./google-analytics"
import { GoogleTagManager } from "./google-tag-manager"
import { FacebookPixel } from "./facebook-pixel"
import type { CookieSettings } from "@/types/cookie-consent"

export function AnalyticsProvider() {
  const [settings, setSettings] = useState<CookieSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/cookie-settings")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Error fetching cookie settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  if (isLoading || !settings || !settings.cookieBannerEnabled) {
    return null
  }

  return (
    <>
      {settings.googleAnalyticsId && <GoogleAnalytics gaId={settings.googleAnalyticsId} />}
      {settings.googleTagManagerId && <GoogleTagManager gtmId={settings.googleTagManagerId} />}
      {settings.facebookPixelId && <FacebookPixel pixelId={settings.facebookPixelId} />}
    </>
  )
}
