"use client"

import { useEffect, useState } from "react"
import { AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface InfoBannerProps {
  defaultVisible?: boolean
}

export function InfoBanner({ defaultVisible = true }: InfoBannerProps) {
  const [isVisible, setIsVisible] = useState(defaultVisible)
  const [bannerInfo, setBannerInfo] = useState<{
    message: string
    enabled: boolean
    color: string
  } | null>(null)

  useEffect(() => {
    // Fetch banner info from API
    const fetchBannerInfo = async () => {
      try {
        const response = await fetch("/api/info-banner")
        if (response.ok) {
          const data = await response.json()
          setBannerInfo(data)
        }
      } catch (error) {
        console.error("Failed to fetch banner info:", error)
      }
    }

    fetchBannerInfo()
  }, [])

  if (!bannerInfo?.enabled) {
    return null
  }

  return (
    <Alert
      className={cn(
        "relative border-none rounded-none",
        isVisible ? "block" : "hidden",
        bannerInfo?.color || "bg-primary text-primary-foreground",
      )}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex-1">{bannerInfo?.message}</AlertDescription>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  )
}
