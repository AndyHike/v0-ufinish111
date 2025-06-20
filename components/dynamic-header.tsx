"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Smartphone } from "lucide-react"

interface DynamicHeaderProps {
  fallbackLogo?: string
}

export function DynamicLogo({ fallbackLogo }: DynamicHeaderProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch("/api/admin/settings")
        if (response.ok) {
          const data = await response.json()
          const logoSetting = data.settings?.find((s: any) => s.key === "site_logo")
          if (logoSetting?.value) {
            setLogoUrl(logoSetting.value)
          }
        }
      } catch (error) {
        console.error("Error fetching logo:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogo()
  }, [])

  if (isLoading) {
    return <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
  }

  if (logoUrl) {
    return (
      <div className="relative h-8 w-32">
        <Image src={logoUrl || "/placeholder.svg"} alt="Site Logo" fill className="object-contain" priority />
      </div>
    )
  }

  if (fallbackLogo) {
    return (
      <div className="relative h-8 w-32">
        <Image src={fallbackLogo || "/placeholder.svg"} alt="Site Logo" fill className="object-contain" priority />
      </div>
    )
  }

  return <Smartphone className="h-8 w-8" />
}
