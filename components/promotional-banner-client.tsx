"use client"

import { useState, useEffect } from "react"
import { X, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface BannerData {
    id: string
    enabled: boolean
    color: string
    text_cs: string
    text_en: string
    text_uk: string
    button_text_cs: string
    button_text_en: string
    button_text_uk: string
    button_link: string
}

interface PromotionalBannerClientProps {
    locale: string
}

export function PromotionalBannerClient({ locale }: PromotionalBannerClientProps) {
    const [data, setData] = useState<BannerData | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const response = await fetch("/api/promotional-banner")
                if (!response.ok) return
                const bannerData = await response.json()
                if (!bannerData || !bannerData.enabled) return

                // Check if dismissed in this session
                const isDismissed = sessionStorage.getItem(`banner_dismissed_${bannerData.id}`)
                if (isDismissed) return

                setData(bannerData)
                setIsVisible(true)
            } catch (error) {
                console.error("Error fetching banner:", error)
            }
        }

        fetchBanner()
    }, [])

    if (!isVisible || !data) {
        return null
    }

    // Use the appropriate translation
    const text = locale === "en" ? data.text_en : locale === "uk" ? data.text_uk : data.text_cs
    const buttonText = locale === "en" ? data.button_text_en : locale === "uk" ? data.button_text_uk : data.button_text_cs

    if (!text) return null

    const handleDismiss = () => {
        sessionStorage.setItem(`banner_dismissed_${data.id}`, "true")
        setIsVisible(false)
    }

    const colorClasses = data.color || "bg-primary text-primary-foreground"

    return (
        <div className={cn("relative z-[60] w-full py-2.5 px-4 shadow-sm", colorClasses)}>
            <div className="container flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 pr-6 sm:pr-0">
                <p className="text-sm font-medium text-center">{text}</p>

                {buttonText && (
                    <Link
                        href={data.button_link?.startsWith('http') ? data.button_link : `/${locale}${data.button_link?.startsWith('/') ? '' : '/'}${data.button_link || 'contact'}`}
                        className="shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors inline-flex items-center gap-1.5"
                        target={data.button_link?.startsWith('http') ? "_blank" : undefined}
                        rel={data.button_link?.startsWith('http') ? "noopener noreferrer" : undefined}
                    >
                        {buttonText}
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                )}
            </div>

            <button
                onClick={handleDismiss}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
                aria-label="Close banner"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
