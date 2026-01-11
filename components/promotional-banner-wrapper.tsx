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
    requestAnimationFrame(() => {
      setIsMounted(true)
    })
  }, [])

  if (!data || !data.enabled) {
    return null
  }

  if (!isMounted) {
    return null
  }

  return <PromotionalBanner data={data} locale={locale} />
}
