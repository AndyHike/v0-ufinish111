"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { Check, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useReservationCart } from "@/components/booking/reservation-cart-provider"
import { reservationLineId, type ReservationCartLine } from "@/lib/booking/reservation-cart"

type AddToReservationButtonProps = {
  locale: string
  line: Omit<ReservationCartLine, "id" | "discountChoice">
}

export function AddToReservationButton({ locale, line }: AddToReservationButtonProps) {
  const t = useTranslations("StandaloneBooking")
  const { addLine, lines } = useReservationCart()
  const { toast } = useToast()

  const id = reservationLineId(line.serviceId, line.modelId)
  const inCart = lines.some((existing) => existing.id === id)

  const handleAdd = () => {
    addLine(line)
    toast({
      title: t("addedToReservation") || "Added to reservation",
      description: `${line.serviceName} — ${line.brandName} ${line.modelName}`,
      action: (
        <Link
          href={`/${locale}/book/reservation`}
          className="inline-flex h-8 items-center rounded-md border border-gray-200 px-3 text-xs font-medium hover:bg-gray-50"
        >
          {t("viewReservation") || "View"}
        </Link>
      ),
    })
  }

  if (inCart) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href={`/${locale}/book/reservation`}>
          <Check className="mr-2 h-4 w-4 text-emerald-600" />
          {t("inReservationGoToCart") || "In reservation — review"}
        </Link>
      </Button>
    )
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={handleAdd}>
      <Plus className="mr-2 h-4 w-4" />
      {t("addAnotherService") || "Add to cart"}
    </Button>
  )
}
