"use client"

import { useEffect } from "react"
import { useSiteSettings } from "@/hooks/use-site-settings"
import { normalizeSiteAssetPath, siteAppleIconPath, siteFaviconPath } from "@/lib/site-assets"

export function DynamicFavicon() {
  const { settings, loading } = useSiteSettings()

  useEffect(() => {
    if (loading) return

    const faviconHref = normalizeSiteAssetPath(settings.siteFavicon, siteFaviconPath)
    const appleIconHref = faviconHref === siteFaviconPath ? siteAppleIconPath : faviconHref

    // Update favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (favicon) {
      favicon.href = faviconHref
    } else {
      // Create favicon link if it doesn't exist
      const newFavicon = document.createElement("link")
      newFavicon.rel = "icon"
      newFavicon.href = faviconHref
      document.head.appendChild(newFavicon)
    }

    // Update apple-touch-icon if favicon is PNG
    if (appleIconHref.endsWith(".png")) {
      let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement
      if (!appleTouchIcon) {
        appleTouchIcon = document.createElement("link")
        appleTouchIcon.rel = "apple-touch-icon"
        document.head.appendChild(appleTouchIcon)
      }
      appleTouchIcon.href = appleIconHref
    }
  }, [settings.siteFavicon, loading])

  return null
}
