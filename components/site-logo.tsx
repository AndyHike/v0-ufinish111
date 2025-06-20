"use client"

import { useSiteSettings } from "@/hooks/use-site-settings"

interface SiteLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function SiteLogo({ className = "", size = "md" }: SiteLogoProps) {
  const { settings, loading } = useSiteSettings()

  // Не показуємо нічого під час завантаження або якщо немає логотипу
  if (loading || !settings.siteLogo) {
    return null
  }

  const sizeClasses = getSizeClasses(size)

  return (
    <img
      src={settings.siteLogo || "/placeholder.svg"}
      alt="Site Logo"
      className={`object-contain ${sizeClasses} ${className}`}
      onError={(e) => {
        // Ховаємо зображення при помилці
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
