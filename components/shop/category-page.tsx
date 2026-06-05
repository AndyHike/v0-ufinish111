import Link from "next/link"

import { ProductCard } from "@/components/shop/product-card"
import { StructuredData } from "@/components/shop/structured-data"
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "@/lib/shop/seo"
import { getLocalizedText } from "@/lib/shop/catalog"
import { shopSiteUrl } from "@/lib/site-config"
import type { ShopCategory, ShopLocale, ShopProductCardView } from "@/lib/shop/types"

const CATEGORY_COPY = {
  cs: {
    shop: "Shop",
    filters: "Kompatibilita",
    filtersText: "Filtry podle atributu se pripoji po napojeni realneho katalogoveho API.",
    empty: "V teto kategorii zatim nejsou produkty.",
    products: "Produkty",
  },
  uk: {
    shop: "Shop",
    filters: "Сумісність",
    filtersText: "Фільтри за атрибутами підключимо після інтеграції реального catalog API.",
    empty: "У цій категорії поки немає товарів.",
    products: "Товари",
  },
  en: {
    shop: "Shop",
    filters: "Compatibility",
    filtersText: "Attribute filters will connect after the real catalog API integration.",
    empty: "There are no products in this category yet.",
    products: "Products",
  },
} as const

export function CategoryPage({
  locale,
  category,
  products,
}: {
  locale: ShopLocale
  category: ShopCategory
  products: ShopProductCardView[]
}) {
  const copy = CATEGORY_COPY[locale]
  const title = getLocalizedText(category.title, locale)
  const description = getLocalizedText(category.description, locale)
  const canonicalUrl = category.seo.locales[locale]?.canonicalUrl ?? category.seo.canonicalUrl
  const collectionJsonLd = buildCollectionPageJsonLd({ name: title, description, url: canonicalUrl })
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: copy.shop, url: `${shopSiteUrl}/${locale}` },
    { name: title, url: canonicalUrl },
  ])

  return (
    <div className="bg-white text-gray-950">
      <StructuredData id="shop-category-jsonld" data={collectionJsonLd} />
      <StructuredData id="shop-category-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <div className="container px-4 py-8 md:px-6">
        <nav className="text-sm text-gray-500">
          <Link href={`/${locale}`} className="hover:text-gray-900">
            {copy.shop}
          </Link>
          <span className="mx-2">/</span>
          <span>{title}</span>
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold">{copy.filters}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {["iPhone", "Samsung", "USB-C"].map((label) => (
                <span key={label} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {label}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-600">{copy.filtersText}</p>
          </aside>

          <main>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-500">{copy.products}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">{description}</p>

            {products.length > 0 ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.itemId} locale={locale} product={product} />
                ))}
              </div>
            ) : (
              <p className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">{copy.empty}</p>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
