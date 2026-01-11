"use client"

import { useEffect, useState } from "react"
import { PromotionalBanner } from "@/components/promotional-banner"
import type { PromotionalBannerData } from "@/lib/data/promotional-banner"

interface PromotionalBannerWrapperProps {
  data: PromotionalBannerData | null
  locale: string
}

export function PromotionalBannerWrapper({ data, locale }: PromotionalBannerWrapperProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    console.log("[v0] PromotionalBannerWrapper mounted:", {
      hasData: !!data,
      enabled: data?.enabled, // Changed from is_active to enabled to match DB schema
      locale,
    })
  }, [data, locale])

  if (!isMounted || !data || !data.enabled) {
    return null
  }

  return <PromotionalBanner data={data} locale={locale} />
}
