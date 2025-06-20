"use client"

import { useEffect } from "react"

export function DynamicLayoutHead() {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const response = await fetch("/api/admin/settings")
        if (response.ok) {
          const data = await response.json()
          const faviconSetting = data.settings?.find((s: any) => s.key === "site_favicon")

          if (faviconSetting?.value) {
            // Update favicon
            const link =
              (document.querySelector("link[rel*='icon']") as HTMLLinkElement) || document.createElement("link")
            link.type = "image/x-icon"
            link.rel = "shortcut icon"
            link.href = faviconSetting.value
            document.getElementsByTagName("head")[0].appendChild(link)
          }
        }
      } catch (error) {
        console.error("Error updating favicon:", error)
      }
    }

    updateFavicon()
  }, [])

  return null
}
