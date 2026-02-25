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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Використовуємо публічний API endpoint без аутентифікації
        const response = await fetch("/api/settings/public")
        if (!response.ok) {
          console.warn("[v0] Failed to fetch public settings:", response.status)
          setLoading(false)
          return
        }

        const data = await response.json()
        setSettings({
          gtmId: data.google_tag_manager_id || "",
          pixelId: data.facebook_pixel_id || "",
        })
      } catch (error) {
        console.warn("[v0] Error loading analytics settings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { ...settings, loading }
}
