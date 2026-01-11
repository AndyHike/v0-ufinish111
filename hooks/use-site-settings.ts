"use client"

import { useState, useEffect } from "react"

interface SiteSettings {
  defaultLanguage: string
  siteLogo: string
  siteFavicon: string
}

const DEFAULT_SETTINGS: SiteSettings = {
  defaultLanguage: "uk",
  siteLogo: "", // Empty initially to match server
  siteFavicon: "/favicon.ico",
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

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
  }, [isMounted])

  return {
    settings: isMounted ? settings : DEFAULT_SETTINGS,
    loading,
    error,
    refetch: () => window.location.reload(),
  }
}
