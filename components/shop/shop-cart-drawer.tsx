"use client"

import Link from "next/link"
import { X } from "lucide-react"

import { useShopCart } from "@/components/shop/shop-cart-provider"
import { Button } from "@/components/ui/button"
import { formatShopPrice } from "@/lib/shop/catalog"
import type { ShopLocale } from "@/lib/shop/types"

const CART_DRAWER_COPY = {
  cs: {
    title: "Kosik",
    empty: "Kosik je zatim prazdny.",
    continueShopping: "Pokracovat v nakupu",
    checkout: "Oformit objednavku",
    cartPage: "Otevrit kosik",
    total: "Mezisoucet",
    close: "Zavrit kosik",
    remove: "Odebrat",
  },
  uk: {
    title: "Кошик",
    empty: "Кошик поки порожній.",
    continueShopping: "Продовжити покупки",
    checkout: "Оформити замовлення",
    cartPage: "Відкрити кошик",
    total: "Проміжна сума",
    close: "Закрити кошик",
    remove: "Видалити",
  },
  en: {
    title: "Cart",
    empty: "Your cart is empty.",
    continueShopping: "Continue shopping",
    checkout: "Checkout",
    cartPage: "Open cart",
    total: "Subtotal",
    close: "Close cart",
    remove: "Remove",
  },
} as const

export function ShopCartDrawer({ locale }: { locale: ShopLocale }) {
  const copy = CART_DRAWER_COPY[locale]
  const { closeCart, isCartOpen, lines, removeLine } = useShopCart()
  const subtotal = lines.reduce((sum, line) => sum + line.priceSnapshot * line.quantity, 0)

  if (!isCartOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50" data-testid="shop-cart-drawer">
      <button
        type="button"
        aria-label={copy.close}
        className="absolute inset-0 bg-gray-950/40"
        onClick={closeCart}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-cart-drawer-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id="shop-cart-drawer-title" className="text-lg font-semibold">
            {copy.title}
          </h2>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={closeCart}
            aria-label={copy.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
              <p className="text-sm text-gray-600">{copy.empty}</p>
              <Button className="mt-5" variant="outline" onClick={closeCart}>
                {copy.continueShopping}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((line) => (
                <div key={line.variantId} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold leading-5 text-gray-950">{line.titleSnapshot}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {line.quantity} x {formatShopPrice(line.priceSnapshot, locale)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-gray-500 hover:text-gray-950"
                      onClick={() => removeLine(line.variantId)}
                    >
                      {copy.remove}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-600">{copy.total}</span>
            <span className="text-lg font-semibold text-gray-950">{formatShopPrice(subtotal, locale)}</span>
          </div>
          <Button asChild className="mt-4 w-full" size="lg" onClick={closeCart}>
            <Link href={`/${locale}/checkout`}>{copy.checkout}</Link>
          </Button>
          <Button asChild variant="outline" className="mt-2 w-full" onClick={closeCart}>
            <Link href={`/${locale}/cart`}>{copy.cartPage}</Link>
          </Button>
        </div>
      </aside>
    </div>
  )
}
