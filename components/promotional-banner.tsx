"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DiscountRequestModal } from "@/components/discount-request-modal"
import type { PromotionalBannerData } from "@/lib/data/promotional-banner"

interface PromotionalBannerProps {
  data: PromotionalBannerData
  locale: string
}

export function PromotionalBanner({ data, locale }: PromotionalBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!isVisible) {
    return null
  }

  const text = data[`text_${locale}` as keyof PromotionalBannerData] as string
  const buttonText = data[`button_text_${locale}` as keyof PromotionalBannerData] as string

  if (!text || !buttonText) {
    console.log("[v0] PromotionalBanner: Missing text or buttonText for locale", locale)
    return null
  }

  return (
    <>
      <div className={cn("relative w-full py-3 px-4", data.color, "text-white")}>
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm md:text-base font-medium">{text}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="secondary"
              size="sm"
              className="whitespace-nowrap font-semibold"
            >
              {buttonText}
            </Button>

            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded-full hover:bg-black/10 transition-colors"
              aria-label="Close banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <DiscountRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        locale={locale}
        promotionText={text}
      />
    </>
  )
}
