import { NextResponse } from "next/server"

import { formatShopPrice } from "@/lib/shop/catalog"
import { searchShopProducts } from "@/lib/shop/data"
import type { ShopLocale } from "@/lib/shop/types"

const SUPPORTED_LOCALES: ShopLocale[] = ["cs", "uk", "en"]
const MAX_RESULTS = 8

function resolveLocale(value: string | null): ShopLocale {
  return SUPPORTED_LOCALES.includes(value as ShopLocale) ? (value as ShopLocale) : "cs"
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get("q") ?? "").trim()
  const locale = resolveLocale(searchParams.get("locale"))

  if (query.length < 2) {
    return NextResponse.json({ query, results: [] })
  }

  try {
    const products = await searchShopProducts(locale, query, MAX_RESULTS)
    const results = products.map((product) => ({
      itemId: product.itemId,
      title: product.title,
      href: product.href,
      image: product.image,
      priceFrom: product.priceFrom,
      price: formatShopPrice(product.displayPrice, locale),
      availabilityLabel: product.availabilityLabel,
      isPurchasable: product.isPurchasable,
    }))
    return NextResponse.json({ query, results })
  } catch {
    return NextResponse.json({ query, results: [], error: "SEARCH_FAILED" }, { status: 502 })
  }
}
