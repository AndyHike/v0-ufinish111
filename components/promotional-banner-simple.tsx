"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DiscountRequestModal } from "@/components/discount-request-modal"

interface PromotionalBannerProps {
  initialData: {
    enabled: boolean
    color: string
    text_cs: string
    text_en: string
    text_uk: string
    button_text_cs: string
    button_text_en: string
    button_text_uk: string
  } | null
  locale: string
}

const colorMap: Record<string, string> = {
  orange: "#ff6b35",
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#10b981",
  purple: "#8b5cf6",
  yellow: "#eab308",
}

export function PromotionalBannerSimple({ initialData, locale }: PromotionalBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Load banner visibility from localStorage after mount
  useEffect(() => {
    const isDismissed = localStorage.getItem("promo-banner-dismissed") === "true"
    setIsVisible(!isDismissed && !!initialData?.enabled)
  }, [initialData?.enabled])

  if (!initialData || !isVisible) {
    return null
  }

  const text = initialData[`text_${locale}`] || initialData.text_cs
  const buttonText = initialData[`button_text_${locale}`] || initialData.button_text_cs

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem("promo-banner-dismissed", "true")
  }

  const bannerColor = colorMap[initialData.color] || colorMap.orange

  return (
    <>
      <div
        className="relative flex items-center justify-center px-4 py-3 text-white"
        style={{ backgroundColor: bannerColor }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <p className="text-sm sm:text-base font-semibold text-center">{text}</p>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="secondary"
            size="sm"
            className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6"
          >
            {buttonText}
          </Button>
        </div>
        <button
          onClick={handleClose}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <DiscountRequestModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}
