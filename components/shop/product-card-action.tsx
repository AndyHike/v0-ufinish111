"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Check, ShoppingBag } from "lucide-react"

import { useShopCart } from "@/components/shop/shop-cart-provider"
import type { ShopLocale, ShopProductCardView } from "@/lib/shop/types"

const ACTION_COPY: Record<ShopLocale, { add: string; added: string; details: string; outOfStock: string }> = {
  cs: { add: "Do kosiku", added: "Pridano", details: "Detail", outOfStock: "Neni skladem" },
  uk: { add: "У кошик", added: "Додано", details: "Детальніше", outOfStock: "Немає в наявності" },
  en: { add: "Add to cart", added: "Added", details: "Details", outOfStock: "Out of stock" },
}

export function ProductCardAction({
  product,
  locale,
}: {
  product: ShopProductCardView
  locale: ShopLocale
}) {
  const copy = ACTION_COPY[locale]
  const { addLine } = useShopCart()
  const [added, setAdded] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // Products with several variants can't be added in one click — send the
  // customer to the detail page to pick a model first.
  if (product.priceFrom) {
    return (
      <Link
        href={product.href}
        className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
      >
        {copy.details}
      </Link>
    )
  }

  if (!product.isPurchasable) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-md border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-400"
      >
        {copy.outOfStock}
      </button>
    )
  }

  const maxQuantity = product.availableStock === null ? 99 : product.availableStock

  return (
    <button
      type="button"
      onClick={() => {
        addLine(
          {
            itemId: product.itemId,
            variantId: product.variantId,
            quantity: 1,
            titleSnapshot: product.title,
            priceSnapshot: product.displayPrice,
            imageSnapshot: product.image,
            currency: product.currency,
          },
          maxQuantity,
        )
        setAdded(true)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => setAdded(false), 1600)
      }}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
    >
      {added ? (
        <>
          <Check className="h-4 w-4" />
          {copy.added}
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4" />
          {copy.add}
        </>
      )}
    </button>
  )
}
