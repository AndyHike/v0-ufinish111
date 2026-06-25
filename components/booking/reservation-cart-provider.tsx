"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react"

import type { BookingDiscountChoice } from "@/lib/discounts/booking-discounts"
import {
  addReservationLine,
  getReservationLineCount,
  removeReservationLine,
  setReservationLineDiscount,
  type ReservationCart,
  type ReservationCartLine,
} from "@/lib/booking/reservation-cart"

// Bump the version suffix if the persisted line shape changes.
const RESERVATION_STORAGE_KEY = "devicehelp.reservation.v1"

type AddLineInput = Omit<ReservationCartLine, "id" | "discountChoice"> & {
  id?: string
  discountChoice?: BookingDiscountChoice
}

type ReservationCartAction =
  | { type: "add"; line: AddLineInput }
  | { type: "remove"; id: string }
  | { type: "setDiscount"; id: string; discountChoice: BookingDiscountChoice }
  | { type: "replace"; cart: ReservationCart }
  | { type: "clear" }

export function reservationCartReducer(state: ReservationCart, action: ReservationCartAction): ReservationCart {
  switch (action.type) {
    case "clear":
      return { lines: [] }
    case "replace":
      return action.cart
    case "remove":
      return removeReservationLine(state, action.id)
    case "setDiscount":
      return setReservationLineDiscount(state, action.id, action.discountChoice)
    case "add":
      return addReservationLine(state, action.line)
    default:
      return state
  }
}

const ReservationCartContext = createContext<{
  lines: ReservationCartLine[]
  count: number
  hydrated: boolean
  addLine: (line: AddLineInput) => void
  removeLine: (id: string) => void
  setLineDiscount: (id: string, discountChoice: BookingDiscountChoice) => void
  clear: () => void
} | null>(null)

export function ReservationCartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reservationCartReducer, { lines: [] })
  // Identical empty markup on server + first client render, then hydrate from
  // localStorage after mount to avoid a hydration mismatch.
  const [hydrated, setHydrated] = useState(false)
  const count = getReservationLineCount(state)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RESERVATION_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as ReservationCart
        if (parsed && Array.isArray(parsed.lines)) {
          dispatch({ type: "replace", cart: { lines: parsed.lines } })
        }
      }
    } catch {
      // Ignore unavailable/corrupt storage; cart simply stays empty.
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore quota/availability errors.
    }
  }, [hydrated, state])

  const addLine = useCallback((line: AddLineInput) => dispatch({ type: "add", line }), [])
  const removeLine = useCallback((id: string) => dispatch({ type: "remove", id }), [])
  const setLineDiscount = useCallback(
    (id: string, discountChoice: BookingDiscountChoice) => dispatch({ type: "setDiscount", id, discountChoice }),
    [],
  )
  const clear = useCallback(() => dispatch({ type: "clear" }), [])

  const value = useMemo(
    () => ({ lines: state.lines, count, hydrated, addLine, removeLine, setLineDiscount, clear }),
    [state.lines, count, hydrated, addLine, removeLine, setLineDiscount, clear],
  )

  return <ReservationCartContext.Provider value={value}>{children}</ReservationCartContext.Provider>
}

export function useReservationCart() {
  const context = useContext(ReservationCartContext)
  if (!context) {
    throw new Error("useReservationCart must be used inside ReservationCartProvider")
  }
  return context
}
