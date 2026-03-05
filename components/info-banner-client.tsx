"use client"

import { useState, useEffect } from "react"
import { AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface BannerData {
  message: string
  enabled: boolean
  color: string
}

/**
 * Client-side info banner that fetches its own data from the API.
 * Does NOT block page load — fetches after hydration.
 * Does NOT break SSG — no server-side data dependency.
 * Admin panel controls enabled/disabled via /api/info-banner.
 */
export function InfoBannerClient() {
  const [data, setData] = useState<BannerData | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Check if user already dismissed the banner this session
    const dismissed = sessionStorage.getItem("info-banner-dismissed")
    if (dismissed === "true") {
      setIsVisible(false)
      return
    }

    // Fetch banner data non-blocking
    fetch("/api/info-banner")
      .then((res) => res.ok ? res.json() : null)
      .then((bannerData) => {
        if (bannerData?.enabled && bannerData?.message) {
          setData(bannerData)
        }
      })
      .catch(() => {
        // Silently fail — banner is not critical
      })
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    sessionStorage.setItem("info-banner-dismissed", "true")
  }

  // Don't render anything until we have data and it's enabled
  if (!data?.enabled || !data?.message || !isVisible) {
    return null
  }

  return (
    <Alert
      className={cn("relative border-none rounded-none", data.color || "bg-primary text-primary-foreground")}
      suppressHydrationWarning
    >
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex-1">{data.message}</AlertDescription>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  )
}
