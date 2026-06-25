"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ClipboardList } from "lucide-react"

import { useReservationCart } from "@/components/booking/reservation-cart-provider"

export function ReservationCartFab({ locale }: { locale: string }) {
  const t = useTranslations("StandaloneBooking")
  const { count, hydrated } = useReservationCart()
  const pathname = usePathname()

  // Nothing to show until something is in the cart; also hide on the
  // reservation page itself (the list is already there).
  if (!hydrated || count === 0 || pathname?.endsWith("/book/reservation")) {
    return null
  }

  return (
    <Link
      href={`/${locale}/book/reservation`}
      aria-label={t("viewReservation") || "View reservation"}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
    >
      <span className="relative">
        <ClipboardList className="h-5 w-5" />
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-xs font-bold text-white">
          {count}
        </span>
      </span>
      <span className="hidden sm:inline">{t("reservation") || "Reservation"}</span>
    </Link>
  )
}
