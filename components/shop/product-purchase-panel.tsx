"use client"

import { Minus, Plus, RotateCcw, ShieldCheck, ShoppingCart, Truck, Zap } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { ProductVariantSelector } from "@/components/shop/product-variant-selector"
import { useShopCart } from "@/components/shop/shop-cart-provider"
import { Button } from "@/components/ui/button"
import {
  formatShopPrice,
  getAvailabilityLabel,
  getLocalizedText,
  getMaxPurchasableQuantity,
  getVariantProductTitle,
} from "@/lib/shop/catalog"
import type { ShopItem, ShopLocale, ShopVariant } from "@/lib/shop/types"

const PURCHASE_COPY = {
  cs: {
    sku: "Kod",
    variant: "Varianta",
    quantity: "Mnozstvi",
    add: "Pridat do kosiku",
    added: "Pridano",
    buyNow: "Objednat na 1 klik",
    outOfStock: "Neni skladem",
    delivery: "Doruceni 1-3 dny",
    deliveryNote: "zdarma od 1500 CZK",
    warranty: "Zaruka 12 mes.",
    warrantyNote: "oficialni",
    returns: "Vraceni 14 dnu",
    returnsNote: "bez zbytecnych otazek",
    payment: "Platba",
  },
  uk: {
    sku: "Артикул",
    variant: "Варіант",
    quantity: "Кількість",
    add: "Додати в кошик",
    added: "Додано",
    buyNow: "Замовити в 1 клік",
    outOfStock: "Немає в наявності",
    delivery: "Доставка 1–3 дні",
    deliveryNote: "безкоштовно від 1500 CZK",
    warranty: "Гарантія 12 міс.",
    warrantyNote: "офіційна",
    returns: "Повернення 14 днів",
    returnsNote: "без зайвих питань",
    payment: "Оплата",
  },
  en: {
    sku: "SKU",
    variant: "Variant",
    quantity: "Quantity",
    add: "Add to cart",
    added: "Added",
    buyNow: "Buy now in 1 click",
    outOfStock: "Out of stock",
    delivery: "Delivery 1–3 days",
    deliveryNote: "free over 1500 CZK",
    warranty: "Warranty 12 mo.",
    warrantyNote: "official",
    returns: "Returns 14 days",
    returnsNote: "no questions asked",
    payment: "Payment",
  },
} as const

const PAYMENT_METHODS = ["Visa", "Mastercard", "Apple Pay", "Google Pay"] as const

function clampInputQuantity(value: number, maxQuantity: number): number {
  if (!Number.isFinite(value) || maxQuantity <= 0) {
    return 1
  }

  return Math.max(1, Math.min(value, maxQuantity))
}

function PanelFeature({
  icon: Icon,
  title,
  note,
}: {
  icon: typeof Truck
  title: string
  note: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-700" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{note}</p>
      </div>
    </div>
  )
}

export function ProductPurchasePanel({
  locale,
  item,
  selectedVariant,
  onSelectVariant,
  singleVariantView = false,
}: {
  locale: ShopLocale
  item: Pick<ShopItem, "id" | "title" | "description" | "variants" | "categories">
  selectedVariant: ShopVariant
  /**
   * Variant selection is owned by the page (gallery and specifications depend
   * on it too); the panel only reports the user's choice upward.
   */
  onSelectVariant: (variantId: string) => void
  /**
   * The page was opened at a specific variant slug, so the variant *is* the
   * product: show its combined title and hide the variant picker.
   */
  singleVariantView?: boolean
}) {
  const copy = PURCHASE_COPY[locale]
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null)
  const { addLine, openCart } = useShopCart()
  const variant = selectedVariant
  const maxQuantity = getMaxPurchasableQuantity(variant)
  const canBuy = maxQuantity > 0
  const displayPrice = variant.salePrice ?? variant.price
  const discountPercent =
    variant.salePrice && variant.price > 0
      ? Math.round((1 - variant.salePrice / variant.price) * 100)
      : 0
  const showVariantSelector = item.variants.length > 1 && !singleVariantView
  const selectedVariantTitle = getLocalizedText(variant.title, locale)
  const category = item.categories[0]
  const categoryTitle = category ? getLocalizedText(category.title, locale) : ""
  // In single-variant view the variant is the product, so the heading carries
  // both the item and variant title (matching its category card).
  const productTitle = singleVariantView
    ? getVariantProductTitle(item, variant, locale)
    : getLocalizedText(item.title, locale)
  const productDescription = getLocalizedText(item.description, locale)

  const addToCart = () => {
    addLine(
      {
        itemId: item.id,
        variantId: variant.id,
        quantity,
        titleSnapshot: getVariantProductTitle(item, variant, locale),
        priceSnapshot: displayPrice,
        imageSnapshot: variant.images[0],
        currency: "CZK",
      },
      maxQuantity,
    )
    setAddedVariantId(variant.id)
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold leading-tight tracking-tight text-gray-950 sm:text-3xl">
        {productTitle}
      </h1>

      {variant.sku || categoryTitle ? (
        <p className="mt-2 text-xs text-gray-500">
          {variant.sku ? (
            <>
              {copy.sku}: <span className="font-medium text-gray-700">{variant.sku}</span>
            </>
          ) : null}
          {variant.sku && categoryTitle ? <span className="mx-1.5">·</span> : null}
          {categoryTitle}
        </p>
      ) : null}

      {productDescription ? (
        <p className="mt-3 text-sm leading-6 text-gray-600">{productDescription}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-gray-100 pt-5">
        <span className="text-3xl font-bold tracking-tight text-gray-950">
          {formatShopPrice(displayPrice, locale)}
        </span>
        {variant.salePrice ? (
          <>
            <span className="text-base text-gray-500 line-through">{formatShopPrice(variant.price, locale)}</span>
            {discountPercent > 0 ? (
              <span className="rounded-md bg-red-50 px-2 py-0.5 text-sm font-semibold text-red-600">
                −{discountPercent}%
              </span>
            ) : null}
          </>
        ) : null}
      </div>

      <p className="mt-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
            canBuy ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${canBuy ? "bg-green-500" : "bg-gray-400"}`} />
          {getAvailabilityLabel(variant, locale)}
        </span>
      </p>

      {showVariantSelector ? (
        <div className="mt-6">
          <label className="text-sm font-semibold">
            {copy.variant}: <span className="text-gray-950">{selectedVariantTitle}</span>
          </label>
          <div className="mt-3">
            <ProductVariantSelector
              locale={locale}
              variants={item.variants}
              selectedVariantId={variant.id}
              onSelectVariant={(nextVariantId) => {
                onSelectVariant(nextVariantId)
                setQuantity(1)
                setAddedVariantId(null)
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <label className="text-sm font-semibold" htmlFor="shop-product-quantity">
          {copy.quantity}
        </label>
        <div className="mt-2 inline-flex h-11 items-center rounded-lg border border-gray-300">
          <button
            type="button"
            aria-label="-"
            disabled={!canBuy || quantity <= 1}
            onClick={() => setQuantity((current) => clampInputQuantity(current - 1, maxQuantity))}
            className="flex h-full w-11 items-center justify-center rounded-l-lg text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            id="shop-product-quantity"
            data-testid="shop-product-quantity"
            type="number"
            min={1}
            max={Math.max(1, maxQuantity)}
            value={quantity}
            onChange={(event) => setQuantity(clampInputQuantity(Number(event.target.value), maxQuantity))}
            className="h-full w-12 border-x border-gray-300 text-center text-sm font-medium outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            disabled={!canBuy}
          />
          <button
            type="button"
            aria-label="+"
            disabled={!canBuy || quantity >= maxQuantity}
            onClick={() => setQuantity((current) => clampInputQuantity(current + 1, maxQuantity))}
            className="flex h-full w-11 items-center justify-center rounded-r-lg text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
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
          <ShoppingCart className="mr-2 h-5 w-5" aria-hidden />
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
            <Zap className="mr-2 h-4 w-4" aria-hidden />
            {copy.buyNow}
          </Button>
        ) : null}
      </div>

      <div className="mt-6 border-t border-gray-200 pt-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PanelFeature icon={Truck} title={copy.delivery} note={copy.deliveryNote} />
          <PanelFeature icon={ShieldCheck} title={copy.warranty} note={copy.warrantyNote} />
          <PanelFeature icon={RotateCcw} title={copy.returns} note={copy.returnsNote} />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">{copy.payment}:</span>
          {PAYMENT_METHODS.map((method) => (
            <span
              key={method}
              className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
