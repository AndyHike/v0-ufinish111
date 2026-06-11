import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ProductPage } from "@/components/shop/product-page"
import { getLocalizedText } from "@/lib/shop/catalog"
import { getShopProductData, getShopProductSlugParams } from "@/lib/shop/data"
import { buildShopMetadata } from "@/lib/shop/seo"
import type { ShopLocale } from "@/lib/shop/types"

export const revalidate = 3600

export async function generateStaticParams() {
  return getShopProductSlugParams()
}

function parseSlugs(slugs: string[]) {
  return {
    itemSlug: slugs[0],
    variantSlug: slugs[1],
    isValid: slugs.length >= 1 && slugs.length <= 2,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: ShopLocale; slugs: string[] }>
}): Promise<Metadata> {
  const { locale, slugs } = await params
  const { itemSlug, variantSlug, isValid } = parseSlugs(slugs)

  if (!isValid || !itemSlug) {
    return {}
  }

  const data = await getShopProductData(locale, itemSlug, variantSlug)

  if (!data) {
    return {}
  }

  return buildShopMetadata({
    locale,
    seo: data.item.seo,
    fallbackTitle: getLocalizedText(data.item.title, locale),
    fallbackDescription: getLocalizedText(data.item.description, locale),
  })
}

export default async function ShopProductRoute({
  params,
}: {
  params: Promise<{ locale: ShopLocale; slugs: string[] }>
}) {
  const { locale, slugs } = await params
  const { itemSlug, variantSlug, isValid } = parseSlugs(slugs)

  if (!isValid || !itemSlug) {
    notFound()
  }

  const data = await getShopProductData(locale, itemSlug, variantSlug)

  if (!data) {
    notFound()
  }

  return (
    <ProductPage
      key={`${data.item.id}:${data.selectedVariant.id}`}
      locale={locale}
      item={data.item}
      selectedVariant={data.selectedVariant}
      relatedItems={data.relatedItems}
      variantView={data.isVariantView}
    />
  )
}
