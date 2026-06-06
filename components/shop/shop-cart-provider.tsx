"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react"

import {
  addCartLine,
  getCartLineCount,
  removeCartLine,
  setCartLineQuantity,
  type ShopCart,
  type ShopCartLine,
} from "@/lib/shop/cart"

// Bump the version suffix if the persisted cart shape changes.
const CART_STORAGE_KEY = "devicehelp.shop.cart.v1"

type ShopCartAction =
  | { type: "add"; line: ShopCartLine; maxQuantity: number }
  | { type: "remove"; variantId: string }
  | { type: "setQuantity"; variantId: string; quantity: number; maxQuantity: number }
  | { type: "replace"; cart: ShopCart }
  | { type: "clear" }

export function shopCartReducer(state: ShopCart, action: ShopCartAction): ShopCart {
  if (action.type === "clear") {
    return { lines: [] }
  }

  if (action.type === "replace") {
    return action.cart
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
  isCartOpen: boolean
  addLine: (line: ShopCartLine, maxQuantity: number) => void
  removeLine: (variantId: string) => void
  setQuantity: (variantId: string, quantity: number, maxQuantity: number) => void
  clear: () => void
  openCart: () => void
  closeCart: () => void
} | null>(null)

export function ShopCartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(shopCartReducer, { lines: [] })
  const [isCartOpen, setIsCartOpen] = useState(false)
  // Start empty on both server and first client render (identical markup), then
  // hydrate from localStorage after mount to avoid a hydration mismatch.
  const [hydrated, setHydrated] = useState(false)
  const count = getCartLineCount(state)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as ShopCart
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
    // Persist only after the initial hydration so we never clobber a stored
    // cart with the empty initial state.
    if (!hydrated) {
      return
    }
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore quota/availability errors.
    }
  }, [hydrated, state])
  const addLine = useCallback((line: ShopCartLine, maxQuantity: number) => dispatch({ type: "add", line, maxQuantity }), [])
  const removeLine = useCallback((variantId: string) => dispatch({ type: "remove", variantId }), [])
  const setQuantity = useCallback(
    (variantId: string, quantity: number, maxQuantity: number) =>
      dispatch({ type: "setQuantity", variantId, quantity, maxQuantity }),
    [],
  )
  const clear = useCallback(() => dispatch({ type: "clear" }), [])
  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  const value = useMemo(
    () => ({
      lines: state.lines,
      count,
      isCartOpen,
      addLine,
      removeLine,
      setQuantity,
      clear,
      openCart,
      closeCart,
    }),
    [addLine, clear, closeCart, count, isCartOpen, openCart, removeLine, setQuantity, state.lines],
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
