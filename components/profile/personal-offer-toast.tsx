"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ToastAction } from "@/components/ui/toast"
import { toast } from "@/components/ui/use-toast"
import type { PersonalProfileOffer } from "@/lib/discounts/profile-offers"

export function PersonalOfferToast({
  offer,
  locale,
}: {
  offer: PersonalProfileOffer | null
  locale: string
}) {
  const t = useTranslations("Profile")
  const router = useRouter()

  useEffect(() => {
    if (!offer) return

    const storageKey = `personal-offer-toast:${offer.id}`
    if (window.localStorage.getItem(storageKey)) return

    const dismissOfferToast = () => {
      window.localStorage.setItem(storageKey, "dismissed")
    }

    toast({
      title: t("offerToastTitle"),
      description: `${offer.title} - ${offer.discountValueLabel}`,
      duration: 7000,
      onOpenChange: (open) => {
        if (!open) dismissOfferToast()
      },
      action: (
        <ToastAction
          altText={t("offerToastAction")}
          onClick={() => {
            dismissOfferToast()
            router.push(`/${locale}/profile`)
          }}
        >
          {t("offerToastAction")}
        </ToastAction>
      ),
    })
  }, [locale, offer, router, t])

  return null
}
