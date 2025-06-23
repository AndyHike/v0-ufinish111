"use client"

import { useSiteSettings } from "@/hooks/use-site-settings"
import { useEffect } from "react"

interface SiteLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function SiteLogo({ className = "", size = "md" }: SiteLogoProps) {
  const { settings } = useSiteSettings()

  useEffect(() => {
    console.log("SiteLogo settings:", settings)
  }, [settings])

  // Якщо немає логотипу, не показуємо нічого
  if (!settings.siteLogo) {
    console.log("No siteLogo found, returning null")
    return null
  }

  const sizeClasses = getSizeClasses(size)

  console.log("Rendering logo with src:", settings.siteLogo)

  return (
    <img
      src={settings.siteLogo || "/placeholder.svg"}
      alt="Site Logo"
      className={`object-contain ${sizeClasses} ${className}`}
      onLoad={() => console.log("Logo loaded successfully:", settings.siteLogo)}
      onError={(e) => {
        console.log("Logo failed to load:", settings.siteLogo)
        const target = e.target as HTMLImageElement
        target.style.display = "none"
      }}
    />
  )
}

function getSizeClasses(size: "sm" | "md" | "lg"): string {
  switch (size) {
    case "sm":
      return "h-6 w-6"
    case "md":
      return "h-8 w-8"
    case "lg":
      return "h-12 w-12"
    default:
      return "h-8 w-8"
  }
}
