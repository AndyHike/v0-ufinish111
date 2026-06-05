import { mockShopCategories, mockShopItems } from "./mock-data"
import type {
  ShopCategoryData,
  ShopHomeData,
  ShopItem,
  ShopLocale,
  ShopLocalizedText,
  ShopProductCardView,
  ShopProductData,
  ShopVariant,
} from "./types"

const LOCALE_TO_NUMBER_FORMAT: Record<ShopLocale, string> = {
  cs: "cs-CZ",
  uk: "uk-UA",
  en: "en-US",
}

export function getLocalizedText(value: ShopLocalizedText, locale: ShopLocale): string {
  return value[locale] ?? value.cs ?? value.en ?? ""
}

export function formatShopPrice(amount: number, locale: ShopLocale): string {
  return new Intl.NumberFormat(LOCALE_TO_NUMBER_FORMAT[locale], {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getMaxPurchasableQuantity(
  variant: Pick<ShopVariant, "trackInventory" | "availability">,
): number {
  if (!variant.trackInventory || variant.availability.availableStock === null) {
    return 99
  }

  return Math.max(0, variant.availability.availableStock)
}

export function isVariantPurchasable(variant: ShopVariant): boolean {
  return getMaxPurchasableQuantity(variant) > 0
}

export function getAvailabilityLabel(variant: ShopVariant, locale: ShopLocale): string {
  if (!variant.trackInventory || variant.availability.availableStock === null) {
    return locale === "cs" ? "Dostupne" : locale === "uk" ? "Доступно" : "Available"
  }

  if (variant.availability.availableStock <= 0) {
    return locale === "cs" ? "Neni skladem" : locale === "uk" ? "Немає в наявності" : "Out of stock"
  }

  if (locale === "cs") {
    return `Skladem ${variant.availability.availableStock} ks`
  }

  if (locale === "uk") {
    return `В наявності ${variant.availability.availableStock} шт.`
  }

  return `${variant.availability.availableStock} in stock`
}

export function selectProductVariant(item: ShopItem, variantSlug?: string): ShopVariant {
  const variantBySlug = variantSlug ? item.variants.find((variant) => variant.slugOverride === variantSlug) : null
  const selectedVariant = variantBySlug ?? item.variants.find((variant) => variant.isDefault) ?? item.variants[0]

  if (!selectedVariant) {
    throw new Error(`Shop item ${item.slug} has no variants`)
  }

  return selectedVariant
}

export function toProductCard(item: ShopItem, locale: ShopLocale): ShopProductCardView {
  const variant = selectProductVariant(item)

  return {
    itemId: item.id,
    variantId: variant.id,
    slug: item.slug,
    variantSlug: variant.slugOverride,
    title: getLocalizedText(item.title, locale),
    image: variant.images[0] ?? item.images[0] ?? "/placeholder.jpg",
    price: variant.price,
    salePrice: variant.salePrice,
    currency: "CZK",
    href: `/${locale}/product/${item.slug}`,
    availabilityLabel: getAvailabilityLabel(variant, locale),
    availableStock: variant.availability.availableStock,
    isPurchasable: isVariantPurchasable(variant),
  }
}

export function getMockShopHomeData(locale: ShopLocale): ShopHomeData {
  return {
    hero: {
      locale,
      title:
        locale === "cs"
          ? "Premium prislusenstvi a dily pro telefony"
          : locale === "uk"
            ? "Преміальні аксесуари та деталі для телефонів"
            : "Premium phone accessories and parts",
      description:
        locale === "cs"
          ? "Vybrane produkty od servisniho tymu DeviceHelp."
          : locale === "uk"
            ? "Підібрані товари від сервісної команди DeviceHelp."
            : "Curated products from the DeviceHelp service team.",
      image: "/tech-fix-storefront.png",
    },
    categories: mockShopCategories
      .filter((category) => category.isActive)
      .sort((a, b) => a.position - b.position),
    featuredProducts: mockShopItems.map((item) => toProductCard(item, locale)),
  }
}

export function getMockShopCategory(locale: ShopLocale, slug: string): ShopCategoryData | null {
  const category = mockShopCategories.find((item) => item.slug === slug && item.isActive)
  if (!category) {
    return null
  }

  const products = mockShopItems
    .filter((item) => item.categories.some((itemCategory) => itemCategory.slug === slug))
    .map((item) => toProductCard(item, locale))

  return { category, products }
}

export function getMockShopProduct(
  locale: ShopLocale,
  itemSlug: string,
  variantSlug?: string,
): ShopProductData | null {
  const item = mockShopItems.find((product) => product.slug === itemSlug)
  if (!item) {
    return null
  }

  const selectedVariant = selectProductVariant(item, variantSlug)
  const relatedItems = item.linkedItems
    .map((link) => mockShopItems.find((product) => product.slug === link.targetSlug))
    .filter((product): product is ShopItem => Boolean(product))
    .map((product) => toProductCard(product, locale))

  return { item, selectedVariant, relatedItems }
}

export function getAllMockShopProducts(locale: ShopLocale): ShopProductCardView[] {
  return mockShopItems.map((item) => toProductCard(item, locale))
}
