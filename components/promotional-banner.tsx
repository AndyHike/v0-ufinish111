"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    return null
  }

  const colorMap: Record<string, string> = {
    "bg-orange-500": "#f97316",
    "bg-red-500": "#ef4444",
    "bg-amber-500": "#f59e0b",
    "bg-yellow-500": "#eab308",
    "bg-green-500": "#22c55e",
    "bg-blue-500": "#3b82f6",
    "bg-purple-500": "#a855f7",
  }

  const backgroundColor = colorMap[data.color] || colorMap["bg-orange-500"]

  return (
    <>
      <div className="relative w-full py-3 px-4 text-white" style={{ backgroundColor }}>
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
