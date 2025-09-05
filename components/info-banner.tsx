import type { InfoBannerData } from "@/lib/data/info-banner"
import { InfoBannerClient } from "./info-banner-client"

interface InfoBannerProps {
  data: InfoBannerData
}

export function InfoBanner({ data }: InfoBannerProps) {
  if (!data?.enabled) {
    return null
  }

  return <InfoBannerClient data={data} />
}
