"use client"

import { PromotionalBannerClient } from "./promotional-banner-client"
import { useParams } from "next/navigation"

export function PromotionalBanner() {
    const params = useParams()
    const locale = (params?.locale as string) || "cs"

    return <PromotionalBannerClient locale={locale} />
}
