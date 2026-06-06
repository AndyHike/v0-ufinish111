import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CategoryPage } from "@/components/shop/category-page"
import { getLocalizedText, getMockShopCategory, normalizeShopCategoryFilters } from "@/lib/shop/catalog"
import { mockShopCategories, SHOP_LOCALES } from "@/lib/shop/mock-data"
import { buildShopMetadata } from "@/lib/shop/seo"
import type { ShopLocale } from "@/lib/shop/types"

export const revalidate = 3600

export function generateStaticParams() {
  return SHOP_LOCALES.flatMap((locale) =>
    mockShopCategories
      .filter((category) => category.isActive)
      .map((category) => ({
        locale,
        slug: category.slug,
      })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: ShopLocale; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const data = getMockShopCategory(locale, slug)

  if (!data) {
    return {}
  }

  return buildShopMetadata({
    locale,
    seo: data.category.seo,
    fallbackTitle: getLocalizedText(data.category.title, locale),
    fallbackDescription: getLocalizedText(data.category.description, locale),
  })
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ShopCategoryRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: ShopLocale; slug: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale, slug } = await params
  const query = (await searchParams) ?? {}

  // Attribute facets arrive as repeatable `attr_<attributeSlug>` query params.
  const attributes: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(query)) {
    if (!key.startsWith("attr_")) {
      continue
    }
    const attributeSlug = key.slice("attr_".length)
    const values = (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean) as string[]
    if (attributeSlug && values.length > 0) {
      attributes[attributeSlug] = values
    }
  }

  const filters = normalizeShopCategoryFilters({
    sort: firstSearchParam(query.sort),
    minPrice: firstSearchParam(query.minPrice),
    maxPrice: firstSearchParam(query.maxPrice),
    attributes,
  })
  const data = getMockShopCategory(locale, slug, filters)

  if (!data) {
    notFound()
  }

  return (
    <CategoryPage
      locale={locale}
      category={data.category}
      children={data.children}
      ancestors={data.ancestors}
      priceBounds={data.priceBounds}
      filterAttributes={data.filterAttributes}
      activeFilters={data.activeFilters}
      products={data.products}
    />
  )
}
