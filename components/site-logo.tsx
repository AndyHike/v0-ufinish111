"use client"

import { useSiteSettings } from "@/hooks/use-site-settings"

interface SiteLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function SiteLogo({ className = "", size = "md" }: SiteLogoProps) {
  const { settings, loading } = useSiteSettings()

  if (loading) {
    return <div className={`bg-gray-200 animate-pulse rounded ${getSizeClasses(size)} ${className}`} />
  }

  const sizeClasses = getSizeClasses(size)

  return (
    <img
      src={settings.siteLogo || "/placeholder.svg"}
      alt="Site Logo"
      className={`object-contain ${sizeClasses} ${className}`}
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
