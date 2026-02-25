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
        console.log("[v0] Analytics hook: Starting to fetch settings...")
        
        // Використовуємо публічний API endpoint без аутентифікації
        const response = await fetch("/api/settings/public", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        
        console.log("[v0] Analytics hook: API response status:", response.status)
        
        if (!response.ok) {
          console.warn("[v0] Analytics hook: Failed with status", response.status)
          setLoading(false)
          return
        }

        const data = await response.json()
        console.log("[v0] Analytics hook: API returned:", data)
        
        setSettings({
          gtmId: data.google_tag_manager_id || "",
          pixelId: data.facebook_pixel_id || "",
        })
        
        console.log("[v0] Analytics hook: Settings updated, loading = false")
      } catch (error) {
        console.warn("[v0] Analytics hook: Error loading settings:", error)
      } finally {
        console.log("[v0] Analytics hook: finally block - setting loading = false")
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  console.log("[v0] useAnalyticsSettings render:", { gtmId: settings.gtmId ? "SET" : "NOT_SET", pixelId: settings.pixelId ? "SET" : "NOT_SET", loading })

  return { ...settings, loading }
}
