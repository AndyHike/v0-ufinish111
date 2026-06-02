"use server"

import { getSession } from "@/lib/auth/session"
import {
  type BookingDiscountChoice,
  resolveBookingDiscount,
} from "@/lib/discounts/booking-discounts"

export async function getBookingDiscountPreview(params: {
  serviceId: string
  modelId: string
  originalPrice: number
  discountChoice?: BookingDiscountChoice
}) {
  const session = await getSession()

  return resolveBookingDiscount({
    ...params,
    userId: session?.user?.id,
  })
}
