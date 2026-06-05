import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CategoryPage } from "@/components/shop/category-page"
import { getLocalizedText, getMockShopCategory } from "@/lib/shop/catalog"
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

export default async function ShopCategoryRoute({
  params,
}: {
  params: Promise<{ locale: ShopLocale; slug: string }>
}) {
  const { locale, slug } = await params
  const data = getMockShopCategory(locale, slug)

  if (!data) {
    notFound()
  }

  return <CategoryPage locale={locale} category={data.category} products={data.products} />
}
