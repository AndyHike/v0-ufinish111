"use client"

import { useEffect, useState } from "react"

interface AnalyticsSettings {
  gtmId: string
  pixelId: string
}

export function useAnalyticsSettings() {
  const [settings, setSettings] = useState<AnalyticsSettings>({
    gtmId: "",
    pixelId: "",
  })

  useEffect(() => {
    let isMounted = true

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/public", {
          method: "GET",
          signal: AbortSignal.timeout(5000), // 5 сек таймаут
        })

        if (!response.ok) {
          console.warn("[v0] Failed to fetch analytics settings:", response.status)
          return
        }

        const data = await response.json()

        if (isMounted) {
          setSettings({
            gtmId: data.google_tag_manager_id || "",
            pixelId: data.facebook_pixel_id || "",
          })
        }
      } catch (error) {
        console.warn("[v0] Error loading analytics settings:", error)
      }
    }

    fetchSettings()

    return () => {
      isMounted = false
    }
  }, [])

  return settings
}
