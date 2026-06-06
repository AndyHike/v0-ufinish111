"use client"

import { Search } from "lucide-react"
import { useMemo, useState } from "react"

import {
  formatShopPrice,
  getAvailabilityLabel,
  getLocalizedText,
  getMaxPurchasableQuantity,
  getVariantSelectorMode,
} from "@/lib/shop/catalog"
import type { ShopLocale, ShopVariant } from "@/lib/shop/types"

const SELECTOR_COPY = {
  cs: {
    search: "Hledat model",
    noResults: "Zadny model nenalezen",
    outOfStock: "Neni skladem",
  },
  uk: {
    search: "Пошук моделі",
    noResults: "Модель не знайдено",
    outOfStock: "Немає в наявності",
  },
  en: {
    search: "Search model",
    noResults: "No model found",
    outOfStock: "Out of stock",
  },
} as const

function getVariantSearchText(variant: ShopVariant, locale: ShopLocale): string {
  const title = getLocalizedText(variant.title, locale)
  const options = variant.selectedOptions.map((option) => getLocalizedText(option.optionTitle, locale)).join(" ")
  return `${title} ${options} ${variant.sku} ${variant.mpn ?? ""}`.toLowerCase()
}

export function ProductVariantSelector({
  locale,
  variants,
  selectedVariantId,
  onSelectVariant,
}: {
  locale: ShopLocale
  variants: ShopVariant[]
  selectedVariantId: string
  onSelectVariant: (variantId: string) => void
}) {
  const copy = SELECTOR_COPY[locale]
  const [query, setQuery] = useState("")
  const mode = getVariantSelectorMode({ variantCount: variants.length })
  const normalizedQuery = query.trim().toLowerCase()
  const visibleVariants = useMemo(
    () =>
      normalizedQuery
        ? variants.filter((variant) => getVariantSearchText(variant, locale).includes(normalizedQuery))
        : variants,
    [locale, normalizedQuery, variants],
  )

  const listClassName =
    mode === "search"
      ? "mt-3 max-h-72 overflow-y-auto rounded-md border border-gray-200"
      : "mt-3 grid gap-2 sm:grid-cols-2"

  return (
    <div>
      {mode === "search" ? (
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search}
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-gray-950"
          />
        </label>
      ) : null}

      <div className={listClassName}>
        {visibleVariants.map((variant) => {
          const entryMaxQuantity = getMaxPurchasableQuantity(variant)
          const isSelected = variant.id === selectedVariantId
          const displayPrice = variant.salePrice ?? variant.price
          const availability = entryMaxQuantity > 0 ? getAvailabilityLabel(variant, locale) : copy.outOfStock

          return (
            <button
              key={variant.id}
              type="button"
              data-testid={`shop-variant-${variant.id}`}
              onClick={() => onSelectVariant(variant.id)}
              className={`w-full border px-3 py-2 text-left text-sm transition-colors ${
                mode === "search" ? "border-x-0 border-t-0 last:border-b-0" : "rounded-md"
              } ${
                isSelected
                  ? "border-gray-950 bg-gray-950 text-white"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block break-words font-medium">{getLocalizedText(variant.title, locale)}</span>
                  <span className={isSelected ? "mt-1 block text-xs text-gray-200" : "mt-1 block text-xs text-gray-500"}>
                    {availability}
                  </span>
                </span>
                <span className={isSelected ? "shrink-0 text-xs font-semibold text-white" : "shrink-0 text-xs font-semibold text-gray-700"}>
                  {formatShopPrice(displayPrice, locale)}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {visibleVariants.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500">
          {copy.noResults}
        </p>
      ) : null}
    </div>
  )
}
