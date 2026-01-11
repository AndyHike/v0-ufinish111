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
      is_active: data?.is_active,
      locale,
    })
  }, [data, locale])

  if (!isMounted || !data || !data.is_active) {
    return null
  }

  return <PromotionalBanner data={data} locale={locale} />
}
