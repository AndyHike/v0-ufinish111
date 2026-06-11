import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ProductPage } from "@/components/shop/product-page"
import { getLocalizedText, getVariantProductTitle } from "@/lib/shop/catalog"
import { getShopIntegrations, getShopProductData, getShopProductSlugParams } from "@/lib/shop/data"
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

  // Variant URLs are indexable pages of their own: variant-canonical
  // metadata and a variant-specific title (see buildShopMetadata).
  const variant = data.isVariantView ? data.selectedVariant : null

  return buildShopMetadata({
    locale,
    seo: data.item.seo,
    fallbackTitle: variant
      ? getVariantProductTitle(data.item, variant, locale)
      : getLocalizedText(data.item.title, locale),
    fallbackDescription: getLocalizedText(data.item.description, locale),
    variant,
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

  const [data, integrations] = await Promise.all([
    getShopProductData(locale, itemSlug, variantSlug),
    getShopIntegrations(),
  ])

  if (!data) {
    notFound()
  }

  // Delivery price feeds the JSON-LD shippingDetails; omitted when Packeta is off.
  const shipping = integrations.packeta.enabled ? { price: integrations.packeta.shippingPrice } : null

  return (
    <ProductPage
      key={`${data.item.id}:${data.selectedVariant.id}`}
      locale={locale}
      item={data.item}
      selectedVariant={data.selectedVariant}
      relatedItems={data.relatedItems}
      variantView={data.isVariantView}
      shipping={shipping}
    />
  )
}
