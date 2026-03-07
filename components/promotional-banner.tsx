import { getPromotionalBanner } from "@/lib/data/promotional-banner"
import { PromotionalBannerClient } from "./promotional-banner-client"

interface PromotionalBannerProps {
    locale: string
}

export async function PromotionalBanner({ locale }: PromotionalBannerProps) {
    const bannerData = await getPromotionalBanner()

    if (!bannerData || !bannerData.enabled) {
        return null
    }

    return <PromotionalBannerClient data={bannerData} locale={locale} />
}
