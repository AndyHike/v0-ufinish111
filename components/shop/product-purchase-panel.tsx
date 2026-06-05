"use client"

import { useMemo, useState } from "react"

import { useShopCart } from "@/components/shop/shop-cart-provider"
import { Button } from "@/components/ui/button"
import {
  formatShopPrice,
  getAvailabilityLabel,
  getLocalizedText,
  getMaxPurchasableQuantity,
} from "@/lib/shop/catalog"
import type { ShopItem, ShopLocale, ShopVariant } from "@/lib/shop/types"

const PURCHASE_COPY = {
  cs: {
    variant: "Varianta",
    quantity: "Mnozstvi",
    add: "Pridat do kosiku",
    added: "Pridano",
    outOfStock: "Neni skladem",
  },
  uk: {
    variant: "Варіант",
    quantity: "Кількість",
    add: "Додати в кошик",
    added: "Додано",
    outOfStock: "Немає в наявності",
  },
  en: {
    variant: "Variant",
    quantity: "Quantity",
    add: "Add to cart",
    added: "Added",
    outOfStock: "Out of stock",
  },
} as const

function clampInputQuantity(value: number, maxQuantity: number): number {
  if (!Number.isFinite(value) || maxQuantity <= 0) {
    return 1
  }

  return Math.max(1, Math.min(value, maxQuantity))
}

export function ProductPurchasePanel({
  locale,
  item,
  selectedVariant,
}: {
  locale: ShopLocale
  item: Pick<ShopItem, "id" | "title" | "variants">
  selectedVariant: ShopVariant
}) {
  const copy = PURCHASE_COPY[locale]
  const [variantId, setVariantId] = useState(selectedVariant.id)
  const [quantity, setQuantity] = useState(1)
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null)
  const { addLine } = useShopCart()
  const variant = useMemo(
    () => item.variants.find((entry) => entry.id === variantId) ?? selectedVariant,
    [item.variants, selectedVariant, variantId],
  )
  const maxQuantity = getMaxPurchasableQuantity(variant)
  const canBuy = maxQuantity > 0
  const displayPrice = variant.salePrice ?? variant.price

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-semibold">{formatShopPrice(displayPrice, locale)}</span>
        {variant.salePrice ? (
          <span className="text-sm text-gray-400 line-through">{formatShopPrice(variant.price, locale)}</span>
        ) : null}
      </div>
      <p className="mt-2 text-sm font-medium text-gray-600">{getAvailabilityLabel(variant, locale)}</p>

      <div className="mt-6">
        <label className="text-sm font-semibold">{copy.variant}</label>
        <div className="mt-3 grid gap-2">
          {item.variants.map((entry) => {
            const entryMaxQuantity = getMaxPurchasableQuantity(entry)
            const isSelected = entry.id === variant.id

            return (
              <button
                key={entry.id}
                type="button"
                data-testid={`shop-variant-${entry.id}`}
                onClick={() => {
                  setVariantId(entry.id)
                  setQuantity(1)
                  setAddedVariantId(null)
                }}
                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  isSelected ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <span className="font-medium">{getLocalizedText(entry.title, locale)}</span>
                <span className={isSelected ? "ml-2 text-xs text-gray-200" : "ml-2 text-xs text-gray-500"}>
                  {entryMaxQuantity > 0 ? formatShopPrice(entry.salePrice ?? entry.price, locale) : copy.outOfStock}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6">
        <label className="text-sm font-semibold" htmlFor="shop-product-quantity">
          {copy.quantity}
        </label>
        <input
          id="shop-product-quantity"
          data-testid="shop-product-quantity"
          type="number"
          min={1}
          max={Math.max(1, maxQuantity)}
          value={quantity}
          onChange={(event) => setQuantity(clampInputQuantity(Number(event.target.value), maxQuantity))}
          className="mt-2 h-10 w-24 rounded-md border border-gray-300 px-3 text-sm"
          disabled={!canBuy}
        />
      </div>

      <Button
        data-testid="shop-add-to-cart"
        className="mt-6 w-full"
        size="lg"
        disabled={!canBuy}
        onClick={() => {
          addLine(
            {
              itemId: item.id,
              variantId: variant.id,
              quantity,
              titleSnapshot: `${getLocalizedText(item.title, locale)} - ${getLocalizedText(variant.title, locale)}`,
              priceSnapshot: displayPrice,
              currency: "CZK",
            },
            maxQuantity,
          )
          setAddedVariantId(variant.id)
        }}
      >
        {canBuy ? (addedVariantId === variant.id ? copy.added : copy.add) : copy.outOfStock}
      </Button>
    </div>
  )
}
