"use server"

import { getSession } from "@/lib/auth/session"
import {
  type BookingDiscountChoice,
  type BookingDiscountSummary,
  resolveBookingDiscount,
} from "@/lib/discounts/booking-discounts"

export async function getBookingDiscountPreview(params: {
  serviceId: string
  modelId: string
  originalPrice: number
  locale?: string
  discountChoice?: BookingDiscountChoice
}): Promise<BookingDiscountSummary> {
  const session = await getSession()

  return resolveBookingDiscount({
    ...params,
    userId: session?.user?.id,
  })
}

export async function getInitialBookingDiscountState(params: {
  serviceId: string
  modelId: string
  originalPrice: number
  locale?: string
}): Promise<{
  discountChoice: BookingDiscountChoice
  preview: BookingDiscountSummary
  autoSelectedPersonalDiscount: boolean
}> {
  const baseChoice: BookingDiscountChoice = { type: "none" }
  const basePreview = await getBookingDiscountPreview({
    ...params,
    discountChoice: baseChoice,
  })
  const bestPersonalDiscount = basePreview.personalDiscounts[0]

  if (bestPersonalDiscount && bestPersonalDiscount.discountedPrice < basePreview.basePrice) {
    const discountChoice: BookingDiscountChoice = { type: "personal", discountId: bestPersonalDiscount.id }
    const preview = await getBookingDiscountPreview({
      ...params,
      discountChoice,
    })

    return {
      discountChoice,
      preview,
      autoSelectedPersonalDiscount: true,
    }
  }

  return {
    discountChoice: baseChoice,
    preview: basePreview,
    autoSelectedPersonalDiscount: false,
  }
}
