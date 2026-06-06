"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2 } from "lucide-react"

import { useShopCart } from "@/components/shop/shop-cart-provider"
import { Button } from "@/components/ui/button"
import { formatShopPrice } from "@/lib/shop/catalog"
import type { ShopLocale } from "@/lib/shop/types"

const CART_PAGE_COPY = {
  cs: {
    title: "Kosik",
    empty: "Vas kosik je zatim prazdny.",
    continueShopping: "Pokracovat v nakupu",
    summary: "Souhrn objednavky",
    subtotal: "Mezisoucet",
    deliveryNote: "Doprava se spocita v dalsim kroku.",
    total: "Celkem",
    checkout: "Pokracovat k objednavce",
    remove: "Odebrat",
    quantity: "Mnozstvi",
  },
  uk: {
    title: "Кошик",
    empty: "Ваш кошик поки порожній.",
    continueShopping: "Продовжити покупки",
    summary: "Підсумок замовлення",
    subtotal: "Проміжна сума",
    deliveryNote: "Доставка розрахується на наступному кроці.",
    total: "Разом",
    checkout: "Перейти до оформлення",
    remove: "Видалити",
    quantity: "Кількість",
  },
  en: {
    title: "Cart",
    empty: "Your cart is empty.",
    continueShopping: "Continue shopping",
    summary: "Order summary",
    subtotal: "Subtotal",
    deliveryNote: "Delivery is calculated in the next step.",
    total: "Total",
    checkout: "Proceed to checkout",
    remove: "Remove",
    quantity: "Quantity",
  },
} as const

const MAX_LINE_QUANTITY = 99

export function ShopCartPage({ locale }: { locale: ShopLocale }) {
  const copy = CART_PAGE_COPY[locale]
  const { lines, removeLine, setQuantity } = useShopCart()
  const subtotal = lines.reduce((sum, line) => sum + line.priceSnapshot * line.quantity, 0)

  return (
    <div className="container px-4 py-10 md:px-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{copy.title}</h1>

      {lines.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-sm text-gray-600">{copy.empty}</p>
          <Button asChild className="mt-5" variant="outline">
            <Link href={`/${locale}`}>{copy.continueShopping}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {lines.map((line) => (
              <div key={line.variantId} className="flex gap-4 rounded-xl border border-gray-200 p-3 sm:p-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-24">
                  <Image
                    src={line.imageSnapshot ?? "/tech-fix-storefront.png"}
                    alt={line.titleSnapshot}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-sm font-semibold leading-5 text-gray-950">{line.titleSnapshot}</p>
                    <button
                      type="button"
                      onClick={() => removeLine(line.variantId)}
                      aria-label={copy.remove}
                      className="shrink-0 text-gray-400 transition hover:text-gray-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">{formatShopPrice(line.priceSnapshot, locale)}</p>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <div className="inline-flex items-center rounded-md border border-gray-300">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.variantId, line.quantity - 1, MAX_LINE_QUANTITY)}
                        disabled={line.quantity <= 1}
                        aria-label={copy.quantity}
                        className="inline-flex h-8 w-8 items-center justify-center text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm font-medium tabular-nums">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.variantId, line.quantity + 1, MAX_LINE_QUANTITY)}
                        aria-label={copy.quantity}
                        className="inline-flex h-8 w-8 items-center justify-center text-gray-700 transition hover:bg-gray-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className="text-sm font-semibold text-gray-950">
                      {formatShopPrice(line.priceSnapshot * line.quantity, locale)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-xl border border-gray-200 p-5 lg:sticky lg:top-24">
            <h2 className="text-base font-semibold">{copy.summary}</h2>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-600">{copy.subtotal}</span>
              <span className="font-medium text-gray-950">{formatShopPrice(subtotal, locale)}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">{copy.deliveryNote}</p>
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
              <span className="text-sm font-semibold">{copy.total}</span>
              <span className="text-lg font-semibold text-gray-950">{formatShopPrice(subtotal, locale)}</span>
            </div>
            <Button asChild size="lg" className="mt-5 w-full">
              <Link href={`/${locale}/checkout`}>{copy.checkout}</Link>
            </Button>
            <Link
              href={`/${locale}`}
              className="mt-3 block text-center text-sm font-medium text-gray-600 hover:text-gray-950"
            >
              {copy.continueShopping}
            </Link>
          </aside>
        </div>
      )}
    </div>
  )
}
