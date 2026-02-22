"use client"

import { DeviceSelectionGuard } from "@/components/services/device-selection-guard"

interface DeviceSelectionWrapperProps {
  serviceSlug: string
  locale: string
}

export function DeviceSelectionWrapper({ serviceSlug, locale }: DeviceSelectionWrapperProps) {
  return <DeviceSelectionGuard serviceSlug={serviceSlug} locale={locale} />
}
