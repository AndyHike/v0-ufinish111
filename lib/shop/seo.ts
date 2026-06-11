import type { Metadata } from "next"

import { toOGLocale } from "../og-locale"
import { siteLogoPath } from "../site-assets"
import { mainSiteUrl, shopSiteUrl } from "../site-config"
import { getLocalizedText, getVariantProductTitle } from "./catalog"
import type { ShopItem, ShopLocale, ShopSeo, ShopSeoLocale, ShopVariant } from "./types"

const SHOP_LOCALES: ShopLocale[] = ["cs", "uk", "en"]

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

export function buildShopLanguageAlternates(seo: ShopSeo): Partial<Record<ShopLocale | "x-default", string>> {
  const alternates = SHOP_LOCALES.reduce<Partial<Record<ShopLocale | "x-default", string>>>((acc, locale) => {
    const canonicalUrl = seo.locales[locale]?.canonicalUrl
    if (canonicalUrl) {
      acc[locale] = canonicalUrl
    }

    return acc
  }, {})

  // x-default → Czech: the store's primary market; mirrors the home page and
  // the sitemap's hreflang blocks.
  if (alternates.cs) {
    alternates["x-default"] = alternates.cs
  }

  return alternates
}

/**
 * Per-locale URLs of a variant page: the locale's item canonical plus the
 * locale's variant slug. Slug-less variants collapse onto the item URLs.
 */
export function buildShopVariantLanguageAlternates(
  seo: ShopSeo,
  variant: ShopVariant,
): Partial<Record<ShopLocale | "x-default", string>> {
  const alternates: Partial<Record<ShopLocale | "x-default", string>> = {}
  for (const locale of SHOP_LOCALES) {
    const itemCanonicalUrl = seo.locales[locale]?.canonicalUrl
    if (itemCanonicalUrl) {
      alternates[locale] = buildVariantUrl(itemCanonicalUrl, variant, locale)
    }
  }

  if (alternates.cs) {
    alternates["x-default"] = alternates.cs
  }

  return alternates
}

/**
 * URL of the dynamic 1200×630 OG card rendered by app/api/shop/og.
 * Platforms expect ~1.91:1; the admin ogImage is usually a square product
 * photo, so it goes *inside* the card (`img`) instead of being the og:image.
 */
export function buildShopOgImageUrl({
  locale,
  title,
  price,
  image,
}: {
  locale: ShopLocale
  title?: string | null
  price?: number | null
  image?: string | null
}): string {
  const params = new URLSearchParams({ locale })
  if (title) {
    params.set("title", title.slice(0, 120))
  }
  if (typeof price === "number" && Number.isFinite(price)) {
    params.set("price", String(price))
  }
  if (image) {
    params.set("img", image)
  }
  return `${shopSiteUrl}/api/shop/og?${params.toString()}`
}

export function buildShopMetadata({
  locale,
  seo,
  fallbackTitle,
  fallbackDescription,
  variant,
}: {
  locale: ShopLocale
  seo: ShopSeo
  fallbackTitle: string
  fallbackDescription: string
  /**
   * Set when the page was opened via a variant slug. Variant pages are
   * indexable URLs of their own (the seo/urls feed lists them in the
   * sitemap), so they self-canonicalize instead of pointing at the parent
   * item; canonical/hreflang/OG then use the variant URLs. Slug-less
   * variants still collapse onto the item canonical.
   */
  variant?: ShopVariant | null
}): Metadata {
  const localizedSeo = getShopSeoLocale(seo, locale)
  const itemCanonicalUrl = localizedSeo?.canonicalUrl ?? seo.canonicalUrl
  const canonicalUrl = variant ? buildVariantUrl(itemCanonicalUrl, variant, locale) : itemCanonicalUrl
  // The admin meta/og titles are authored for the item page; variant pages
  // take the variant-specific fallback so indexable variants don't share one
  // title across the whole group.
  const title = variant ? fallbackTitle : (localizedSeo?.metaTitle ?? fallbackTitle)
  const description = localizedSeo?.metaDescription ?? fallbackDescription
  const ogTitle = variant ? title : (localizedSeo?.ogTitle ?? title)
  const facts = localizedSeo?.structuredDataFacts
  const innerImage =
    absoluteShopUrl(variant?.images[0]) ?? absoluteShopUrl(localizedSeo?.ogImage) ?? absoluteShopUrl(facts?.image)
  const ogPrice = variant
    ? (variant.salePrice ?? variant.price)
    : facts?.kind === "product"
      ? (facts.salePrice ?? facts.price ?? null)
      : null
  const ogImageUrl = buildShopOgImageUrl({
    locale,
    title: ogTitle,
    price: ogPrice,
    image: innerImage,
  })
  const ogImages = [{ url: ogImageUrl, width: 1200, height: 630, alt: ogTitle }]

  return {
    title,
    description,
    metadataBase: new URL(shopSiteUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: variant ? buildShopVariantLanguageAlternates(seo, variant) : buildShopLanguageAlternates(seo),
    },
    robots: localizedSeo?.robots ?? seo.robots,
    openGraph: {
      title: ogTitle,
      description: localizedSeo?.ogDescription ?? description,
      url: canonicalUrl,
      siteName: "DeviceHelp Shop",
      locale: toOGLocale(locale),
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: localizedSeo?.ogDescription ?? description,
      images: [ogImageUrl],
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

function buildVariantUrl(itemCanonicalUrl: string, variant: ShopVariant, locale: ShopLocale): string {
  // Per-locale variant slug first; the canonical slugOverride carries the
  // store default locale. Slug-less (default) variants share the item URL.
  const slug = variant.slugLocalized?.[locale]?.trim() || variant.slugOverride
  return slug ? `${itemCanonicalUrl}/${slug}` : itemCanonicalUrl
}

/** Flat delivery price for the JSON-LD offer; comes from the store's Packeta config. */
export interface ShopOfferShippingInput {
  /** Price in CZK; null/0 = free delivery. */
  price: number | null
}

// 14 days is the EU distance-selling minimum (Directive 2011/83/EU, § 1829 NOZ).
const MERCHANT_RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "CZ",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 14,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
}

function buildShippingDetails(shipping: ShopOfferShippingInput) {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: shipping.price ?? 0,
      currency: "CZK",
    },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "CZ" },
    // Packeta pickup points: same/next-day dispatch, 1-3 business days in transit.
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
    },
  }
}

function buildOffer(variant: ShopVariant, shipping?: ShopOfferShippingInput | null) {
  return {
    "@type": "Offer",
    priceCurrency: "CZK",
    price: String(variant.salePrice ?? variant.price),
    availability: availabilityToSchema(getVariantAvailability(variant)),
    itemCondition: "https://schema.org/NewCondition",
    hasMerchantReturnPolicy: MERCHANT_RETURN_POLICY,
    shippingDetails: shipping ? buildShippingDetails(shipping) : undefined,
  }
}

// Variant-defining attribute slugs mapped to schema.org variesBy URLs.
const VARIES_BY_SCHEMA: Record<string, string> = {
  color: "https://schema.org/color",
  colour: "https://schema.org/color",
  barva: "https://schema.org/color",
  kolir: "https://schema.org/color",
  size: "https://schema.org/size",
  velikost: "https://schema.org/size",
  rozmir: "https://schema.org/size",
  material: "https://schema.org/material",
  pattern: "https://schema.org/pattern",
}

function buildVariesBy(item: ShopItem): string[] {
  const slugs = new Set<string>()
  for (const variant of item.variants) {
    for (const option of variant.selectedOptions) {
      slugs.add(option.attributeSlug)
    }
  }
  return Array.from(slugs).map((slug) => VARIES_BY_SCHEMA[slug] ?? slug)
}

export function buildProductJsonLd(
  item: ShopItem,
  selectedVariant: ShopVariant,
  locale: ShopLocale,
  options?: { shipping?: ShopOfferShippingInput | null },
) {
  const localizedSeo = getShopSeoLocale(item.seo, locale)
  const facts = localizedSeo?.structuredDataFacts ?? getShopSeoLocale(item.seo, "cs")?.structuredDataFacts
  const itemCanonicalUrl = localizedSeo?.canonicalUrl ?? item.seo.canonicalUrl
  const shipping = options?.shipping ?? null
  const brand = item.brand ? { "@type": "Brand", name: item.brand } : undefined
  const description = getLocalizedText(item.description, locale)
  const schemaType = facts?.schemaType ?? "ProductGroup"
  const variesBy = buildVariesBy(item)
  const variants = item.variants.map((variant) => ({
    "@type": "Product",
    name: getVariantProductTitle(item, variant, locale),
    description,
    brand,
    sku: variant.sku,
    gtin: variant.gtin,
    mpn: variant.mpn,
    url: buildVariantUrl(itemCanonicalUrl, variant, locale),
    image: absoluteShopUrl(variant.images[0] ?? item.images[0]),
    offers: buildOffer(variant, shipping),
  }))

  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: getLocalizedText(item.title, locale),
    description,
    image: absoluteShopUrl(selectedVariant.images[0] ?? item.images[0]),
    brand,
    sku: selectedVariant.sku,
    gtin: selectedVariant.gtin,
    mpn: selectedVariant.mpn,
    url: itemCanonicalUrl,
    offers: buildOffer(selectedVariant, shipping),
    ...(schemaType === "ProductGroup"
      ? {
          // The slug is the stable group key shared by all variants of the item.
          productGroupID: item.slug,
          ...(variesBy.length ? { variesBy } : {}),
        }
      : {}),
    hasVariant: variants,
  }
}

// ---- Organization / WebSite (shop home) -------------------------------------

const SHOP_ORGANIZATION_ID = `${shopSiteUrl}/#organization`

export function buildShopOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": SHOP_ORGANIZATION_ID,
    name: "DeviceHelp",
    url: mainSiteUrl,
    logo: { "@type": "ImageObject", url: `${mainSiteUrl}${siteLogoPath}` },
    // Contact details match generateLocalBusinessSchema on the main site.
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: "+420775848259",
      email: "info@devicehelp.cz",
      availableLanguage: ["cs", "uk", "en"],
    },
  }
}

export function buildShopWebSiteJsonLd(locale: ShopLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${shopSiteUrl}/#website`,
    url: shopSiteUrl,
    name: "DeviceHelp Shop",
    inLanguage: locale,
    publisher: { "@id": SHOP_ORGANIZATION_ID },
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
