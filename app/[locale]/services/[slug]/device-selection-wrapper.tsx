"use client"

import { DeviceSelectionGuard } from "@/components/services/device-selection-guard"

interface Brand {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

interface DeviceSelectionWrapperProps {
  serviceSlug: string
  locale: string
  initialBrands?: Brand[]
}

export function DeviceSelectionWrapper({ serviceSlug, locale, initialBrands = [] }: DeviceSelectionWrapperProps) {
  return <DeviceSelectionGuard serviceSlug={serviceSlug} locale={locale} initialBrands={initialBrands} />
}
