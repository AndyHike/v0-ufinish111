"use client"

import { useSiteSettings } from "@/hooks/use-site-settings"

interface SiteLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function SiteLogo({ className = "", size = "md" }: SiteLogoProps) {
  const { settings } = useSiteSettings()

  // Якщо немає логотипу або він не завантажується, показуємо placeholder
  const logoSrc = settings.siteLogo || "/placeholder-logo.png"

  const sizeClasses = getSizeClasses(size)

  return (
    <img
      src={logoSrc || "/placeholder.svg"}
      alt="Site Logo"
      className={`object-contain ${sizeClasses} ${className}`}
      onError={(e) => {
        const target = e.target as HTMLImageElement
        // Якщо основний логотип не завантажується, спробуємо placeholder
        if (target.src !== "/placeholder-logo.png") {
          target.src = "/placeholder-logo.png"
        } else {
          // Якщо і placeholder не завантажується, ховаємо елемент
          target.style.display = "none"
        }
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
