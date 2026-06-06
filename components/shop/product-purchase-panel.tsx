"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { ProductVariantSelector } from "@/components/shop/product-variant-selector"
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
    buyNow: "Objednat",
    outOfStock: "Neni skladem",
  },
  uk: {
    variant: "Варіант",
    quantity: "Кількість",
    add: "Додати в кошик",
    added: "Додано",
    buyNow: "Замовити",
    outOfStock: "Немає в наявності",
  },
  en: {
    variant: "Variant",
    quantity: "Quantity",
    add: "Add to cart",
    added: "Added",
    buyNow: "Buy now",
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
  const router = useRouter()
  const [variantId, setVariantId] = useState(selectedVariant.id)
  const [quantity, setQuantity] = useState(1)
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null)
  const { addLine, openCart } = useShopCart()
  const variant = useMemo(
    () => item.variants.find((entry) => entry.id === variantId) ?? selectedVariant,
    [item.variants, selectedVariant, variantId],
  )
  const maxQuantity = getMaxPurchasableQuantity(variant)
  const canBuy = maxQuantity > 0
  const displayPrice = variant.salePrice ?? variant.price

  const addToCart = () => {
    addLine(
      {
        itemId: item.id,
        variantId: variant.id,
        quantity,
        titleSnapshot: `${getLocalizedText(item.title, locale)} - ${getLocalizedText(variant.title, locale)}`,
        priceSnapshot: displayPrice,
        imageSnapshot: variant.images[0],
        currency: "CZK",
      },
      maxQuantity,
    )
    setAddedVariantId(variant.id)
  }

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
        <div className="mt-3">
          <ProductVariantSelector
            locale={locale}
            variants={item.variants}
            selectedVariantId={variant.id}
            onSelectVariant={(nextVariantId) => {
              setVariantId(nextVariantId)
              setQuantity(1)
              setAddedVariantId(null)
            }}
          />
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

      <div className="mt-6 space-y-2">
        <Button
          data-testid="shop-add-to-cart"
          className="w-full"
          size="lg"
          disabled={!canBuy}
          onClick={() => {
            addToCart()
            openCart()
          }}
        >
          {canBuy ? (addedVariantId === variant.id ? copy.added : copy.add) : copy.outOfStock}
        </Button>
        {canBuy ? (
          <Button
            data-testid="shop-buy-now"
            className="w-full"
            size="lg"
            variant="outline"
            onClick={() => {
              addToCart()
              router.push(`/${locale}/checkout`)
            }}
          >
            {copy.buyNow}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
