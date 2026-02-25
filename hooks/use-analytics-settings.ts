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
        const response = await fetch("/api/admin/cookie-settings")
        if (!response.ok) throw new Error("Failed to fetch settings")

        const data = await response.json()
        setSettings({
          gtmId: data.google_tag_manager_id || "",
          pixelId: data.facebook_pixel_id || "",
        })
      } catch (error) {
        console.error("[v0] Failed to load analytics settings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { ...settings, loading }
}
