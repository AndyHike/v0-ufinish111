import type { Metadata } from "next"

import { toOGLocale } from "../og-locale"
import { shopSiteUrl } from "../site-config"
import { getLocalizedText } from "./catalog"
import type { ShopItem, ShopLocale, ShopSeo, ShopSeoLocale, ShopVariant } from "./types"

const SHOP_LOCALES: ShopLocale[] = ["cs", "uk", "en"]

export interface ShopSitemapRecord {
  url: string
  alternates: Partial<Record<ShopLocale, string>>
  changeFrequency: "daily" | "weekly" | "monthly"
  priority: number
}

export function getShopSeoLocale(seo: ShopSeo, locale: ShopLocale): ShopSeoLocale | null {
  return seo.locales[locale] ?? seo.locales.cs ?? null
}

export function absoluteShopUrl(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  try {
    return new URL(value).toString()
  } catch {
    return new URL(value, shopSiteUrl).toString()
  }
}

export function buildShopLanguageAlternates(seo: ShopSeo): Partial<Record<ShopLocale, string>> {
  return SHOP_LOCALES.reduce<Partial<Record<ShopLocale, string>>>((alternates, locale) => {
    const canonicalUrl = seo.locales[locale]?.canonicalUrl
    if (canonicalUrl) {
      alternates[locale] = canonicalUrl
    }

    return alternates
  }, {})
}

export function buildShopMetadata({
  locale,
  seo,
  fallbackTitle,
  fallbackDescription,
}: {
  locale: ShopLocale
  seo: ShopSeo
  fallbackTitle: string
  fallbackDescription: string
}): Metadata {
  const localizedSeo = getShopSeoLocale(seo, locale)
  const canonicalUrl = localizedSeo?.canonicalUrl ?? seo.canonicalUrl
  const title = localizedSeo?.metaTitle ?? fallbackTitle
  const description = localizedSeo?.metaDescription ?? fallbackDescription
  const ogImage = absoluteShopUrl(localizedSeo?.ogImage)

  return {
    title,
    description,
    metadataBase: new URL(shopSiteUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: buildShopLanguageAlternates(seo),
    },
    robots: localizedSeo?.robots ?? seo.robots,
    openGraph: {
      title: localizedSeo?.ogTitle ?? title,
      description: localizedSeo?.ogDescription ?? description,
      url: canonicalUrl,
      siteName: "DeviceHelp Shop",
      locale: toOGLocale(locale),
      type: "website",
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: localizedSeo?.ogTitle ?? title,
      description: localizedSeo?.ogDescription ?? description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export function availabilityToSchema(availability: string): string {
  if (availability === "out_of_stock") {
    return "https://schema.org/OutOfStock"
  }

  if (availability === "preorder") {
    return "https://schema.org/PreOrder"
  }

  if (availability === "backorder") {
    return "https://schema.org/BackOrder"
  }

  return "https://schema.org/InStock"
}

function getVariantAvailability(variant: ShopVariant): "in_stock" | "out_of_stock" {
  return variant.trackInventory && variant.availability.availableStock === 0 ? "out_of_stock" : "in_stock"
}

function buildVariantUrl(itemCanonicalUrl: string, variant: ShopVariant): string {
  return variant.slugOverride ? `${itemCanonicalUrl}/${variant.slugOverride}` : itemCanonicalUrl
}

function buildOffer(variant: ShopVariant) {
  return {
    "@type": "Offer",
    priceCurrency: "CZK",
    price: String(variant.salePrice ?? variant.price),
    availability: availabilityToSchema(getVariantAvailability(variant)),
    itemCondition: "https://schema.org/NewCondition",
  }
}

export function buildProductJsonLd(item: ShopItem, selectedVariant: ShopVariant, locale: ShopLocale) {
  const localizedSeo = getShopSeoLocale(item.seo, locale)
  const facts = localizedSeo?.structuredDataFacts ?? getShopSeoLocale(item.seo, "cs")?.structuredDataFacts
  const itemCanonicalUrl = localizedSeo?.canonicalUrl ?? item.seo.canonicalUrl
  const variants = item.variants.map((variant) => ({
    "@type": "Product",
    name: `${getLocalizedText(item.title, locale)} - ${getLocalizedText(variant.title, locale)}`,
    sku: variant.sku,
    gtin: variant.gtin,
    mpn: variant.mpn,
    url: buildVariantUrl(itemCanonicalUrl, variant),
    image: absoluteShopUrl(variant.images[0] ?? item.images[0]),
    offers: buildOffer(variant),
  }))

  return {
    "@context": "https://schema.org",
    "@type": facts?.schemaType ?? "ProductGroup",
    name: getLocalizedText(item.title, locale),
    description: getLocalizedText(item.description, locale),
    image: absoluteShopUrl(selectedVariant.images[0] ?? item.images[0]),
    brand: item.brand ? { "@type": "Brand", name: item.brand } : undefined,
    sku: selectedVariant.sku,
    gtin: selectedVariant.gtin,
    mpn: selectedVariant.mpn,
    url: itemCanonicalUrl,
    offers: buildOffer(selectedVariant),
    hasVariant: variants,
  }
}

export function buildCollectionPageJsonLd({
  name,
  description,
  url,
}: {
  name: string
  description: string
  url: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
  }
}

export function buildBreadcrumbJsonLd(_locale: ShopLocale, items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildShopSitemapRecords(seoRecords: ShopSeo[]): ShopSitemapRecord[] {
  return seoRecords
    .filter((seo) => seo.indexable)
    .map((seo) => {
      const priority = seo.profile === "SHOP_HOME" ? 1 : seo.profile === "CATEGORY_LISTING" ? 0.8 : 0.7

      return {
        url: getShopSeoLocale(seo, "cs")?.canonicalUrl ?? seo.canonicalUrl,
        alternates: buildShopLanguageAlternates(seo),
        changeFrequency: "weekly",
        priority,
      }
    })
}
