"use client"

import type React from "react"
import { createContext, useContext, useMemo, useReducer } from "react"

import type { ShopCurrency } from "@/lib/shop/types"

export interface ShopCartLine {
  variantId: string
  itemId: string
  quantity: number
  titleSnapshot: string
  priceSnapshot: number
  currency: ShopCurrency
}

interface ShopCartState {
  lines: ShopCartLine[]
}

type ShopCartAction =
  | { type: "add"; line: ShopCartLine; maxQuantity: number }
  | { type: "remove"; variantId: string }
  | { type: "setQuantity"; variantId: string; quantity: number; maxQuantity: number }
  | { type: "clear" }

function clampQuantity(quantity: number, maxQuantity: number): number {
  if (maxQuantity <= 0) {
    return 0
  }

  return Math.max(1, Math.min(quantity, maxQuantity))
}

export function shopCartReducer(state: ShopCartState, action: ShopCartAction): ShopCartState {
  if (action.type === "clear") {
    return { lines: [] }
  }

  if (action.type === "remove") {
    return { lines: state.lines.filter((line) => line.variantId !== action.variantId) }
  }

  if (action.type === "setQuantity") {
    const quantity = clampQuantity(action.quantity, action.maxQuantity)
    if (quantity === 0) {
      return { lines: state.lines.filter((line) => line.variantId !== action.variantId) }
    }

    return {
      lines: state.lines.map((line) => (line.variantId === action.variantId ? { ...line, quantity } : line)),
    }
  }

  const quantity = clampQuantity(action.line.quantity, action.maxQuantity)
  if (quantity === 0) {
    return state
  }

  const existing = state.lines.find((line) => line.variantId === action.line.variantId)
  if (!existing) {
    return { lines: [{ ...action.line, quantity }] }
  }

  return {
    lines: state.lines.map((line) =>
      line.variantId === action.line.variantId
        ? { ...line, quantity: clampQuantity(line.quantity + action.line.quantity, action.maxQuantity) }
        : line,
    ),
  }
}

const ShopCartContext = createContext<{
  lines: ShopCartLine[]
  count: number
  addLine: (line: ShopCartLine, maxQuantity: number) => void
  removeLine: (variantId: string) => void
  setQuantity: (variantId: string, quantity: number, maxQuantity: number) => void
  clear: () => void
} | null>(null)

export function ShopCartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(shopCartReducer, { lines: [] })
  const count = state.lines.reduce((sum, line) => sum + line.quantity, 0)

  const value = useMemo(
    () => ({
      lines: state.lines,
      count,
      addLine: (line: ShopCartLine, maxQuantity: number) => dispatch({ type: "add", line, maxQuantity }),
      removeLine: (variantId: string) => dispatch({ type: "remove", variantId }),
      setQuantity: (variantId: string, quantity: number, maxQuantity: number) =>
        dispatch({ type: "setQuantity", variantId, quantity, maxQuantity }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [state.lines, count],
  )

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>
}

export function useShopCart() {
  const context = useContext(ShopCartContext)
  if (!context) {
    throw new Error("useShopCart must be used inside ShopCartProvider")
  }

  return context
}
