"use client"

import { useEffect, useState } from "react"
import { GoogleAnalytics } from "./google-analytics"
import { GoogleTagManager } from "./google-tag-manager"
import { FacebookPixel } from "./facebook-pixel"
import { useCookieConsent } from "@/hooks/use-cookie-consent"

interface AnalyticsSettings {
  googleAnalyticsId: string
  googleTagManagerId: string
  facebookPixelId: string
}

export function AnalyticsProvider() {
  const [settings, setSettings] = useState<AnalyticsSettings>({
    googleAnalyticsId: "",
    googleTagManagerId: "",
    facebookPixelId: "",
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const { consent } = useCookieConsent()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/cookie-settings")
        if (response.ok) {
          const data = await response.json()
          setSettings({
            googleAnalyticsId: data.googleAnalyticsId || "",
            googleTagManagerId: data.googleTagManagerId || "",
            facebookPixelId: data.facebookPixelId || "",
          })
        }
      } catch (error) {
        console.error("Error fetching analytics settings:", error)
      } finally {
        setIsLoaded(true)
      }
    }

    fetchSettings()
  }, [])

  if (!isLoaded) {
    return null
  }

  return (
    <>
      {/* Google Analytics - only load if analytics consent is given */}
      {consent.analytics && settings.googleAnalyticsId && (
        <GoogleAnalytics measurementId={settings.googleAnalyticsId} />
      )}

      {/* Google Tag Manager - only load if analytics consent is given */}
      {consent.analytics && settings.googleTagManagerId && (
        <GoogleTagManager containerId={settings.googleTagManagerId} />
      )}

      {/* Facebook Pixel - only load if marketing consent is given */}
      {consent.marketing && settings.facebookPixelId && <FacebookPixel pixelId={settings.facebookPixelId} />}
    </>
  )
}
