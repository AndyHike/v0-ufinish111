"use client"

import type React from "react"
import { createContext, useContext, useMemo, useReducer } from "react"

import {
  addCartLine,
  getCartLineCount,
  removeCartLine,
  setCartLineQuantity,
  type ShopCart,
  type ShopCartLine,
} from "@/lib/shop/cart"

type ShopCartAction =
  | { type: "add"; line: ShopCartLine; maxQuantity: number }
  | { type: "remove"; variantId: string }
  | { type: "setQuantity"; variantId: string; quantity: number; maxQuantity: number }
  | { type: "clear" }

export function shopCartReducer(state: ShopCart, action: ShopCartAction): ShopCart {
  if (action.type === "clear") {
    return { lines: [] }
  }

  if (action.type === "remove") {
    return removeCartLine(state, action.variantId)
  }

  if (action.type === "setQuantity") {
    return setCartLineQuantity(state, action.variantId, action.quantity, action.maxQuantity)
  }

  return addCartLine(state, action.line, action.maxQuantity)
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
  const count = getCartLineCount(state)

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
