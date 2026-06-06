import type { ShopCurrency } from "./types"

export interface ShopCartLine {
  itemId: string
  variantId: string
  quantity: number
  titleSnapshot: string
  priceSnapshot: number
  imageSnapshot?: string
  currency: ShopCurrency
}

export interface ShopCart {
  lines: ShopCartLine[]
}

export function createCartLine({
  itemId,
  variantId,
  title,
  price,
  quantity,
  image,
}: {
  itemId: string
  variantId: string
  title: string
  price: number
  quantity: number
  image?: string
}): ShopCartLine {
  return {
    itemId,
    variantId,
    quantity: Math.max(1, quantity),
    titleSnapshot: title,
    priceSnapshot: price,
    imageSnapshot: image,
    currency: "CZK",
  }
}

function clamp(quantity: number, maxQuantity: number): number {
  if (maxQuantity <= 0) {
    return 0
  }

  return Math.max(1, Math.min(quantity, maxQuantity))
}

export function addCartLine(cart: ShopCart, line: ShopCartLine, maxQuantity: number): ShopCart {
  const quantity = clamp(line.quantity, maxQuantity)
  if (quantity === 0) {
    return cart
  }

  const existing = cart.lines.find((entry) => entry.variantId === line.variantId)
  if (!existing) {
    return { lines: [...cart.lines, { ...line, quantity }] }
  }

  return {
    lines: cart.lines.map((entry) =>
      entry.variantId === line.variantId
        ? { ...entry, quantity: clamp(entry.quantity + line.quantity, maxQuantity) }
        : entry,
    ),
  }
}

export function removeCartLine(cart: ShopCart, variantId: string): ShopCart {
  return { lines: cart.lines.filter((entry) => entry.variantId !== variantId) }
}

export function setCartLineQuantity(
  cart: ShopCart,
  variantId: string,
  quantity: number,
  maxQuantity: number,
): ShopCart {
  const nextQuantity = clamp(quantity, maxQuantity)
  if (nextQuantity === 0) {
    return removeCartLine(cart, variantId)
  }

  return {
    lines: cart.lines.map((entry) => (entry.variantId === variantId ? { ...entry, quantity: nextQuantity } : entry)),
  }
}

export function getCartLineCount(cart: ShopCart): number {
  return cart.lines.reduce((sum, line) => sum + line.quantity, 0)
}

export function getCartSubtotal(cart: ShopCart): number {
  return cart.lines.reduce((sum, line) => sum + line.priceSnapshot * line.quantity, 0)
}
