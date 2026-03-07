"use client"

import { useState, useEffect } from "react"
import { X, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PromotionalBannerData } from "@/lib/data/promotional-banner"
import Link from "next/link"

interface PromotionalBannerClientProps {
    data: PromotionalBannerData
    locale: string
}

export function PromotionalBannerClient({ data, locale }: PromotionalBannerClientProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Check if dismissed in this session
        if (typeof window !== "undefined") {
            const isDismissed = sessionStorage.getItem(`banner_dismissed_${data.id}`)
            if (!isDismissed) {
                setIsVisible(true)
            }
        }
    }, [data.id])

    if (!isVisible) {
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
                        href={`/${locale}/contact`}
                        className="shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors inline-flex items-center gap-1.5"
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
