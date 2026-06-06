"use client"

import { Search } from "lucide-react"
import { useMemo, useState } from "react"

import { getLocalizedText, getMaxPurchasableQuantity, getVariantSelectorMode } from "@/lib/shop/catalog"
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
  // Search box appears only when there are many variants; the chip list itself is
  // always compact (wraps + scrolls within a capped height) so a large variant
  // count never inflates the column.
  const showSearch = getVariantSelectorMode({ variantCount: variants.length }) === "search"
  const normalizedQuery = query.trim().toLowerCase()
  const visibleVariants = useMemo(
    () =>
      normalizedQuery
        ? variants.filter((variant) => getVariantSearchText(variant, locale).includes(normalizedQuery))
        : variants,
    [locale, normalizedQuery, variants],
  )

  return (
    <div>
      {showSearch ? (
        <label className="relative mb-3 block">
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

      {/* Compact wrapping pills. Title-only keeps each chip on one line; the
          selected variant's price/availability is shown in the purchase panel.
          Capped height with internal scroll bounds the column. */}
      <div className="flex max-h-[168px] flex-wrap gap-2 overflow-y-auto pr-0.5">
        {visibleVariants.map((variant) => {
          const entryMaxQuantity = getMaxPurchasableQuantity(variant)
          const isSelected = variant.id === selectedVariantId
          const isOutOfStock = entryMaxQuantity <= 0

          return (
            <button
              key={variant.id}
              type="button"
              data-testid={`shop-variant-${variant.id}`}
              onClick={() => onSelectVariant(variant.id)}
              disabled={isOutOfStock}
              title={isOutOfStock ? copy.outOfStock : undefined}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                isSelected
                  ? "border-gray-950 bg-gray-950 text-white"
                  : isOutOfStock
                    ? "cursor-not-allowed border-gray-200 text-gray-300 line-through"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              {getLocalizedText(variant.title, locale)}
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
