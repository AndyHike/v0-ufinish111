"use client"

import { useSiteSettings } from "@/hooks/use-site-settings"

import Image from "next/image"

interface SiteLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function SiteLogo({ className = "", size = "md" }: SiteLogoProps) {
  const { settings } = useSiteSettings()

  // Always prefer WebP placeholder
  const logoSrc = settings.siteLogo || "/placeholder-logo.webp"

  const sizeClasses = getSizeClasses(size)

  return (
    <div className={`relative ${sizeClasses} ${className}`}>
      <Image
        src={logoSrc}
        alt="Site Logo"
        fill
        sizes="(max-width: 768px) 48px, 48px"
        priority // Critical for LCP in header
        className="object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          if (!target.src.includes("/placeholder-logo.webp")) {
            target.src = "/placeholder-logo.webp"
          } else {
            target.style.display = "none"
          }
        }}
      />
    </div>
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
