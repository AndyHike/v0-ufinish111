import type { BookingDiscountChoice } from "@/lib/discounts/booking-discounts"

// A single service the customer wants done during one visit. Each line carries
// its OWN optional discount choice, because the discount engine resolves per
// (service, model) — a code scoped to "display replacement" must not leak onto
// a battery line. See lib/discounts/booking-discounts.ts.
export type ReservationCartLine = {
  id: string
  serviceId: string
  modelId: string
  serviceName: string
  serviceSlug: string
  brandName: string
  modelName: string
  modelSlug: string
  originalPrice: number
  warrantyMonths?: number | null
  durationHours?: number | null
  discountChoice: BookingDiscountChoice
}

export type ReservationCart = {
  lines: ReservationCartLine[]
}

// Lines are keyed by service+model so the same repair on two different models
// stays as two distinct lines, while re-adding the same pair is a no-op replace.
export function reservationLineId(serviceId: string, modelId: string): string {
  return `${serviceId}:${modelId}`
}

export function addReservationLine(
  cart: ReservationCart,
  line: Omit<ReservationCartLine, "id" | "discountChoice"> & {
    id?: string
    discountChoice?: BookingDiscountChoice
  },
): ReservationCart {
  const id = line.id || reservationLineId(line.serviceId, line.modelId)
  const nextLine: ReservationCartLine = {
    ...line,
    id,
    discountChoice: line.discountChoice || { type: "none" },
  }

  const existingIndex = cart.lines.findIndex((existing) => existing.id === id)
  if (existingIndex === -1) {
    return { lines: [...cart.lines, nextLine] }
  }

  // Replace in place (refresh price/name) but keep the customer's discount
  // choice if they already picked one for this line.
  const lines = cart.lines.slice()
  lines[existingIndex] = { ...nextLine, discountChoice: cart.lines[existingIndex].discountChoice }
  return { lines }
}

export function removeReservationLine(cart: ReservationCart, id: string): ReservationCart {
  return { lines: cart.lines.filter((line) => line.id !== id) }
}

export function setReservationLineDiscount(
  cart: ReservationCart,
  id: string,
  discountChoice: BookingDiscountChoice,
): ReservationCart {
  return {
    lines: cart.lines.map((line) => (line.id === id ? { ...line, discountChoice } : line)),
  }
}

export function getReservationLineCount(cart: ReservationCart): number {
  return cart.lines.length
}

export function hasReservationLine(cart: ReservationCart, serviceId: string, modelId: string): boolean {
  const id = reservationLineId(serviceId, modelId)
  return cart.lines.some((line) => line.id === id)
}
