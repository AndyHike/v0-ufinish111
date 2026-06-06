import { mockShopCategories, mockShopItems } from "./mock-data"
import type {
  ShopCategoryData,
  ShopCategoryFilters,
  ShopCategorySortMode,
  ShopCategoryTreeNode,
  ShopFilterAttribute,
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

const LARGE_VARIANT_THRESHOLD = 6

const SPECIFICATION_COPY = {
  cs: {
    brand: "Znacka",
    category: "Kategorie",
    condition: "Stav",
    sku: "SKU",
    mpn: "MPN",
    gtin: "GTIN",
    availability: "Dostupnost",
    new: "Novy",
    used: "Pouzity",
    refurbished: "Repasovany",
  },
  uk: {
    brand: "Бренд",
    category: "Категорія",
    condition: "Стан",
    sku: "SKU",
    mpn: "MPN",
    gtin: "GTIN",
    availability: "Наявність",
    new: "Новий",
    used: "Вживаний",
    refurbished: "Відновлений",
  },
  en: {
    brand: "Brand",
    category: "Category",
    condition: "Condition",
    sku: "SKU",
    mpn: "MPN",
    gtin: "GTIN",
    availability: "Availability",
    new: "New",
    used: "Used",
    refurbished: "Refurbished",
  },
} as const

export type ShopSpecificationRow = {
  label: string
  value: string
}

export type ShopVariantSelectorMode = "chips" | "search"

export type ShopCategoryFilterInput = {
  sort?: ShopCategorySortMode | string | null
  minPrice?: number | string | null
  maxPrice?: number | string | null
  attributes?: Record<string, Array<string | null | undefined>> | null
}

const SHOP_CATEGORY_SORT_MODES: ShopCategorySortMode[] = ["recommended", "price-asc", "price-desc"]

function sortCategoriesByPosition(a: { position: number; title?: ShopLocalizedText }, b: { position: number; title?: ShopLocalizedText }) {
  if (a.position !== b.position) {
    return a.position - b.position
  }

  return (a.title?.cs ?? "").localeCompare(b.title?.cs ?? "")
}

function parseFilterPrice(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  return Math.round(parsed)
}

export function normalizeShopCategoryFilters(input: ShopCategoryFilterInput = {}): ShopCategoryFilters {
  const sort = SHOP_CATEGORY_SORT_MODES.includes(input.sort as ShopCategorySortMode)
    ? (input.sort as ShopCategorySortMode)
    : "recommended"
  let minPrice = parseFilterPrice(input.minPrice)
  let maxPrice = parseFilterPrice(input.maxPrice)

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    ;[minPrice, maxPrice] = [maxPrice, minPrice]
  }

  const attributes: Record<string, string[]> = {}
  for (const [attributeSlug, values] of Object.entries(input.attributes ?? {})) {
    const cleaned = Array.from(
      new Set((values ?? []).map((value) => (value ?? "").trim()).filter((value) => value.length > 0)),
    )
    if (cleaned.length > 0) {
      attributes[attributeSlug] = cleaned
    }
  }

  return { sort, minPrice, maxPrice, attributes }
}

// Aggregates variant options across items into API-shaped filter facets
// (matches GET /api/public/v1/filters). Counts how many products carry each option.
export function buildShopFilterFacets(items: ShopItem[], locale: ShopLocale): ShopFilterAttribute[] {
  const byAttribute = new Map<string, { name: string; options: Map<string, { value: string; count: number }> }>()

  for (const item of items) {
    const itemOptions = new Map<string, Set<string>>()
    const attributeNames = new Map<string, string>()
    const optionValues = new Map<string, string>()

    for (const variant of item.variants) {
      for (const option of variant.selectedOptions) {
        if (!itemOptions.has(option.attributeSlug)) {
          itemOptions.set(option.attributeSlug, new Set())
        }
        itemOptions.get(option.attributeSlug)?.add(option.optionSlug)
        attributeNames.set(option.attributeSlug, getLocalizedText(option.attributeTitle, locale))
        optionValues.set(`${option.attributeSlug}:${option.optionSlug}`, getLocalizedText(option.optionTitle, locale))
      }
    }

    for (const [attributeSlug, optionSlugs] of itemOptions) {
      const attribute = byAttribute.get(attributeSlug) ?? {
        name: attributeNames.get(attributeSlug) ?? attributeSlug,
        options: new Map(),
      }

      for (const optionSlug of optionSlugs) {
        const option = attribute.options.get(optionSlug) ?? {
          value: optionValues.get(`${attributeSlug}:${optionSlug}`) ?? optionSlug,
          count: 0,
        }
        option.count += 1
        attribute.options.set(optionSlug, option)
      }

      byAttribute.set(attributeSlug, attribute)
    }
  }

  return Array.from(byAttribute.entries())
    .map(([attributeSlug, attribute]) => ({
      id: attributeSlug,
      slug: attributeSlug,
      name: attribute.name,
      type: "SELECT" as const,
      options: Array.from(attribute.options.entries())
        .map(([optionSlug, option]) => ({
          id: optionSlug,
          slug: optionSlug,
          value: option.value,
          count: option.count,
        }))
        .sort((a, b) => a.value.localeCompare(b.value)),
    }))
    .filter((attribute) => attribute.options.length > 0)
}

function itemMatchesAttributes(item: ShopItem, attributes: Record<string, string[]>): boolean {
  for (const [attributeSlug, selectedOptionSlugs] of Object.entries(attributes)) {
    if (selectedOptionSlugs.length === 0) {
      continue
    }

    const matches = item.variants.some((variant) =>
      variant.selectedOptions.some(
        (option) => option.attributeSlug === attributeSlug && selectedOptionSlugs.includes(option.optionSlug),
      ),
    )

    if (!matches) {
      return false
    }
  }

  return true
}

export function getShopProductDisplayPrice(product: Pick<ShopProductCardView, "price" | "salePrice">): number {
  return product.salePrice ?? product.price
}

export function getRootShopCategories(categories = mockShopCategories) {
  return categories
    .filter((category) => category.isActive && category.parentId === null)
    .sort(sortCategoriesByPosition)
}

export function getShopCategoryChildren(parentId: string, categories = mockShopCategories) {
  return categories
    .filter((category) => category.isActive && category.parentId === parentId)
    .sort(sortCategoriesByPosition)
}

export function buildShopCategoryTree(categories = mockShopCategories): ShopCategoryTreeNode[] {
  const activeCategories = categories.filter((category) => category.isActive).sort(sortCategoriesByPosition)
  const childrenByParentId = new Map<string | null, typeof activeCategories>()

  for (const category of activeCategories) {
    const siblings = childrenByParentId.get(category.parentId) ?? []
    siblings.push(category)
    childrenByParentId.set(category.parentId, siblings)
  }

  const buildNode = (category: (typeof activeCategories)[number]): ShopCategoryTreeNode => ({
    category,
    children: (childrenByParentId.get(category.id) ?? []).map(buildNode),
  })

  return (childrenByParentId.get(null) ?? []).map(buildNode)
}

export function getShopCategoryAncestors(category: { parentId: string | null }, categories = mockShopCategories) {
  const categoriesById = new Map(categories.filter((item) => item.isActive).map((item) => [item.id, item]))
  const ancestors: NonNullable<ReturnType<typeof categoriesById.get>>[] = []
  const visited = new Set<string>()
  let parentId = category.parentId

  while (parentId) {
    if (visited.has(parentId)) {
      break
    }

    visited.add(parentId)
    const parent = categoriesById.get(parentId)
    if (!parent) {
      break
    }

    ancestors.unshift(parent)
    parentId = parent.parentId
  }

  return ancestors
}

export function getShopCategoryDescendantIds(categoryId: string, categories = mockShopCategories): string[] {
  const children = getShopCategoryChildren(categoryId, categories)

  return children.flatMap((child) => [child.id, ...getShopCategoryDescendantIds(child.id, categories)])
}

export function getShopCategoryPriceBounds(products: ShopProductCardView[]) {
  if (products.length === 0) {
    return { min: null, max: null }
  }

  const prices = products.map(getShopProductDisplayPrice)

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  }
}

export function applyShopCategoryFilters(products: ShopProductCardView[], input: ShopCategoryFilterInput = {}) {
  const filters = normalizeShopCategoryFilters(input)
  const filtered = products.filter((product) => {
    const price = getShopProductDisplayPrice(product)

    if (filters.minPrice !== null && price < filters.minPrice) {
      return false
    }

    if (filters.maxPrice !== null && price > filters.maxPrice) {
      return false
    }

    return true
  })

  if (filters.sort === "price-asc") {
    return filtered.sort((a, b) => getShopProductDisplayPrice(a) - getShopProductDisplayPrice(b))
  }

  if (filters.sort === "price-desc") {
    return filtered.sort((a, b) => getShopProductDisplayPrice(b) - getShopProductDisplayPrice(a))
  }

  return filtered
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

export function getVariantSelectorMode({ variantCount }: { variantCount: number }): ShopVariantSelectorMode {
  return variantCount > LARGE_VARIANT_THRESHOLD ? "search" : "chips"
}

export function getProductSpecificationRows(
  item: ShopItem,
  selectedVariant: ShopVariant,
  locale: ShopLocale,
): ShopSpecificationRow[] {
  const copy = SPECIFICATION_COPY[locale]
  const rows: ShopSpecificationRow[] = []

  if (item.brand) {
    rows.push({ label: copy.brand, value: item.brand })
  }

  for (const option of selectedVariant.selectedOptions) {
    const label = getLocalizedText(option.attributeTitle, locale)
    const value = getLocalizedText(option.optionTitle, locale)
    if (label && value) {
      rows.push({ label, value })
    }
  }

  const category = item.categories[0]
  if (category) {
    rows.push({ label: copy.category, value: getLocalizedText(category.title, locale) })
  }

  if (item.condition) {
    rows.push({ label: copy.condition, value: copy[item.condition] })
  }

  rows.push({ label: copy.sku, value: selectedVariant.sku })

  if (selectedVariant.mpn) {
    rows.push({ label: copy.mpn, value: selectedVariant.mpn })
  }

  if (selectedVariant.gtin) {
    rows.push({ label: copy.gtin, value: selectedVariant.gtin })
  }

  rows.push({ label: copy.availability, value: getAvailabilityLabel(selectedVariant, locale) })

  return rows
}

export function selectProductVariant(item: ShopItem, variantSlug?: string): ShopVariant {
  const selectedVariant =
    (variantSlug ? item.variants.find((variant) => variant.slugOverride === variantSlug) : null) ??
    item.variants.find((variant) => variant.isDefault) ??
    item.variants[0]

  if (!selectedVariant) {
    throw new Error(`Shop item ${item.slug} has no variants`)
  }

  return selectedVariant
}

export function selectProductVariantByRoute(item: ShopItem, variantSlug?: string): ShopVariant | null {
  if (variantSlug) {
    return item.variants.find((variant) => variant.slugOverride === variantSlug) ?? null
  }

  return selectProductVariant(item)
}

export function toProductCard(item: ShopItem, locale: ShopLocale): ShopProductCardView {
  const variant = selectProductVariant(item)
  const hasOptions = item.variants.length > 1

  // Prefer the cheapest in-stock variant for the "from" price so the card never
  // advertises a price the customer cannot actually buy.
  const purchasableVariants = item.variants.filter(isVariantPurchasable)
  const pricePool = purchasableVariants.length > 0 ? purchasableVariants : item.variants
  const displayPrice = Math.min(...pricePool.map((candidate) => candidate.salePrice ?? candidate.price))

  // A discount badge only makes sense for a single price point; "from X"
  // products span several prices and get no struck-through compare-at.
  const compareAtPrice = !hasOptions && variant.salePrice !== null ? variant.price : null
  const discountPercent =
    compareAtPrice !== null && compareAtPrice > 0
      ? Math.round(((compareAtPrice - displayPrice) / compareAtPrice) * 100)
      : null

  return {
    itemId: item.id,
    variantId: variant.id,
    slug: item.slug,
    variantSlug: variant.slugOverride,
    title: getLocalizedText(item.title, locale),
    image: variant.images[0] ?? item.images[0] ?? "/tech-fix-storefront.png",
    price: variant.price,
    salePrice: variant.salePrice,
    displayPrice,
    priceFrom: hasOptions,
    compareAtPrice,
    discountPercent: discountPercent && discountPercent > 0 ? discountPercent : null,
    currency: "CZK",
    href: `/${locale}/product/${item.slug}`,
    availabilityLabel: getAvailabilityLabel(variant, locale),
    availableStock: variant.availability.availableStock,
    isPurchasable: isVariantPurchasable(variant),
  }
}

export function getMockShopHomeData(locale: ShopLocale): ShopHomeData {
  const categoryTree = buildShopCategoryTree()

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
    categories: getRootShopCategories(),
    categoryTree,
    featuredProducts: mockShopItems.map((item) => toProductCard(item, locale)),
  }
}

export function getMockShopCategory(
  locale: ShopLocale,
  slug: string,
  filtersInput: ShopCategoryFilterInput = {},
): ShopCategoryData | null {
  const category = mockShopCategories.find((item) => item.slug === slug && item.isActive)
  if (!category) {
    return null
  }

  const activeFilters = normalizeShopCategoryFilters(filtersInput)
  const categoryIds = new Set([category.id, ...getShopCategoryDescendantIds(category.id)])
  const matchingItems = mockShopItems.filter((item) =>
    item.categories.some((itemCategory) => categoryIds.has(itemCategory.id)),
  )
  // Facets and price bounds describe the whole category, independent of the
  // current selection, so the panel options stay stable while filtering.
  const filterAttributes = buildShopFilterFacets(matchingItems, locale)
  const unfilteredProducts = matchingItems.map((item) => toProductCard(item, locale))
  const attributeFilteredProducts = matchingItems
    .filter((item) => itemMatchesAttributes(item, activeFilters.attributes))
    .map((item) => toProductCard(item, locale))
  const products = applyShopCategoryFilters(attributeFilteredProducts, activeFilters)

  return {
    category,
    children: getShopCategoryChildren(category.id),
    ancestors: getShopCategoryAncestors(category),
    categoryTree: buildShopCategoryTree(),
    priceBounds: getShopCategoryPriceBounds(unfilteredProducts),
    filterAttributes,
    activeFilters,
    products,
  }
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

  const selectedVariant = selectProductVariantByRoute(item, variantSlug)
  if (!selectedVariant) {
    return null
  }

  const relatedItems = item.linkedItems
    .map((link) => mockShopItems.find((product) => product.slug === link.targetSlug))
    .filter((product): product is ShopItem => Boolean(product))
    .map((product) => toProductCard(product, locale))

  return { item, selectedVariant, relatedItems }
}

export function getAllMockShopProducts(locale: ShopLocale): ShopProductCardView[] {
  return mockShopItems.map((item) => toProductCard(item, locale))
}
