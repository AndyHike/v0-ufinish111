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
        console.log("[v0] Fetching analytics settings...")
        const response = await fetch("/api/admin/cookie-settings")
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.status}`)
        }

        const data = await response.json()
        console.log("[v0] Analytics settings fetched:", {
          gtmId: data.google_tag_manager_id ? "SET" : "NOT_SET",
          pixelId: data.facebook_pixel_id ? "SET" : "NOT_SET",
        })

        setSettings({
          gtmId: data.google_tag_manager_id || "",
          pixelId: data.facebook_pixel_id || "",
        })
      } catch (error) {
        console.error("[v0] Failed to load analytics settings:", error)
        setSettings({
          gtmId: "",
          pixelId: "",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { ...settings, loading }
}
