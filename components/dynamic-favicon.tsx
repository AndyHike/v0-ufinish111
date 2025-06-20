"use client"

import { useEffect } from "react"
import { useSiteSettings } from "@/hooks/use-site-settings"

export function DynamicFavicon() {
  const { settings, loading } = useSiteSettings()

  useEffect(() => {
    if (loading) return

    // Update favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (favicon) {
      favicon.href = settings.siteFavicon
    } else {
      // Create favicon link if it doesn't exist
      const newFavicon = document.createElement("link")
      newFavicon.rel = "icon"
      newFavicon.href = settings.siteFavicon
      document.head.appendChild(newFavicon)
    }

    // Update apple-touch-icon if favicon is PNG
    if (settings.siteFavicon.endsWith(".png")) {
      let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement
      if (!appleTouchIcon) {
        appleTouchIcon = document.createElement("link")
        appleTouchIcon.rel = "apple-touch-icon"
        document.head.appendChild(appleTouchIcon)
      }
      appleTouchIcon.href = settings.siteFavicon
    }
  }, [settings.siteFavicon, loading])

  return null
}
