import Link from "next/link"
import { PromotionalBannerData } from "@/lib/data/promotional-banner"
import { ArrowRight } from "lucide-react"

interface PromotionalBannerProps {
    data: PromotionalBannerData | null
    locale: string
}

export function PromotionalBanner({ data, locale }: PromotionalBannerProps) {
    if (!data || !data.enabled) {
        return null
    }

    // Get localized text
    const text = locale === "uk" ? data.text_uk : locale === "en" ? data.text_en : data.text_cs
    const buttonText = locale === "uk" ? data.button_text_uk : locale === "en" ? data.button_text_en : data.button_text_cs

    if (!text) {
        return null
    }

    // Use the custom link or fallback to contact page
    const targetLink = data.button_link || `/${locale}/contact`

    return (
        <div className={`w-full ${data.color || "bg-orange-500"} text-white px-4 py-2 sm:py-3 relative z-50 flex items-center justify-center`}>
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center sm:text-left">
                <span className="text-sm sm:text-base font-medium">{text}</span>
                {buttonText && (
                    targetLink.startsWith("http") ? (
                        <a
                            href={targetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
                        >
                            {buttonText}
                            <ArrowRight className="ml-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                        </a>
                    ) : (
                        <Link
                            href={targetLink}
                            className="inline-flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
                        >
                            {buttonText}
                            <ArrowRight className="ml-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                        </Link>
                    )
                )}
            </div>
        </div>
    )
}
