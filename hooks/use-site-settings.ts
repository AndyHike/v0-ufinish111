"use client"

import { useState, useEffect } from "react"

interface SiteSettings {
  defaultLanguage: string
  siteLogo: string
  siteFavicon: string
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({
    defaultLanguage: "uk",
    siteLogo: "/placeholder-logo.svg",
    siteFavicon: "/favicon.ico",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/site-settings")
        if (!response.ok) {
          throw new Error("Failed to fetch settings")
        }
        const data = await response.json()
        setSettings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        console.error("Error fetching site settings:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { settings, loading, error, refetch: () => window.location.reload() }
}
