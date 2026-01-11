"use client"

import { useState } from "react"
import { AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import type { InfoBannerData } from "@/lib/data/info-banner"

interface InfoBannerClientProps {
  data: InfoBannerData
}

export function InfoBannerClient({ data }: InfoBannerClientProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) {
    return null
  }

  return (
    <Alert
      className={cn("relative border-none rounded-none", data?.color || "bg-primary text-primary-foreground")}
      suppressHydrationWarning
    >
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex-1">{data?.message}</AlertDescription>
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
