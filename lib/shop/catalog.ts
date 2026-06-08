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
    yes: "Ano",
    no: "Ne",
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
    yes: "Так",
    no: "Ні",
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
    yes: "Yes",
    no: "No",
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

// Returns the set of option slugs an item carries per attribute slug, drawn
// from BOTH structured item-level SELECT attributes and variant-defining
// options (size/color). Used for client-side faceting and filtering so that
// product-level attributes — not just variant options — narrow results.
function collectItemAttributeOptions(
  item: ShopItem,
): Map<string, { attributeKeyId?: string; isVariantDefining: boolean; title: ShopLocalizedText; options: Map<string, ShopLocalizedText> }> {
  const byAttribute = new Map<
    string,
    { attributeKeyId?: string; isVariantDefining: boolean; title: ShopLocalizedText; options: Map<string, ShopLocalizedText> }
  >()

  const ensure = (slug: string, attributeKeyId: string | undefined, title: ShopLocalizedText, isVariantDefining: boolean) => {
    const existing = byAttribute.get(slug)
    if (existing) {
      existing.isVariantDefining ||= isVariantDefining
      existing.attributeKeyId ??= attributeKeyId
      return existing
    }
    const created = { attributeKeyId, isVariantDefining, title, options: new Map<string, ShopLocalizedText>() }
    byAttribute.set(slug, created)
    return created
  }

  for (const attribute of item.attributes) {
    const entry = ensure(attribute.attributeSlug, attribute.attributeKeyId, attribute.attributeTitle, false)
    for (const option of attribute.options) {
      entry.options.set(option.optionSlug, option.optionTitle)
    }
  }

  for (const variant of item.variants) {
    for (const option of variant.selectedOptions) {
      const entry = ensure(option.attributeSlug, option.attributeKeyId, option.attributeTitle, true)
      entry.options.set(option.optionSlug, option.optionTitle)
    }
  }

  return byAttribute
}

// Aggregates item attributes + variant options across items into API-shaped
// filter facets (matches GET /api/public/v1/filters). Counts how many products
// carry each option. Used for the mock catalog and as a fallback when the live
// `/filters` endpoint is unavailable.
export function buildShopFilterFacets(items: ShopItem[], locale: ShopLocale): ShopFilterAttribute[] {
  const byAttribute = new Map<
    string,
    {
      attributeKeyId?: string
      isVariantDefining: boolean
      name: string
      options: Map<string, { value: string; count: number }>
    }
  >()

  for (const item of items) {
    for (const [attributeSlug, source] of collectItemAttributeOptions(item)) {
      const attribute = byAttribute.get(attributeSlug) ?? {
        attributeKeyId: source.attributeKeyId,
        isVariantDefining: source.isVariantDefining,
        name: getLocalizedText(source.title, locale) || attributeSlug,
        options: new Map(),
      }
      attribute.isVariantDefining ||= source.isVariantDefining
      attribute.attributeKeyId ??= source.attributeKeyId

      for (const [optionSlug, optionTitle] of source.options) {
        const option = attribute.options.get(optionSlug) ?? {
          value: getLocalizedText(optionTitle, locale) || optionSlug,
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
      id: attribute.attributeKeyId ?? attributeSlug,
      attributeKeyId: attribute.attributeKeyId ?? attributeSlug,
      slug: attributeSlug,
      name: attribute.name,
      type: "SELECT" as const,
      isVariantDefining: attribute.isVariantDefining,
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

export function itemMatchesAttributes(item: ShopItem, attributes: Record<string, string[]>): boolean {
  const itemOptions = collectItemAttributeOptions(item)

  for (const [attributeSlug, selectedOptionSlugs] of Object.entries(attributes)) {
    if (selectedOptionSlugs.length === 0) {
      continue
    }

    const available = itemOptions.get(attributeSlug)?.options
    // OR within an attribute: the item matches if it carries any selected option.
    const matches = available ? selectedOptionSlugs.some((optionSlug) => available.has(optionSlug)) : false

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

  // Product-level structured SELECT attributes (joined when multiple options).
  for (const attribute of item.attributes) {
    const label = getLocalizedText(attribute.attributeTitle, locale)
    const value = attribute.options
      .map((option) => getLocalizedText(option.optionTitle, locale))
      .filter(Boolean)
      .join(", ")
    if (label && value) {
      rows.push({ label, value })
    }
  }

  // Typed scalar attribute values (TEXT / NUMBER / BOOLEAN).
  for (const attributeValue of item.attributeValues) {
    const label = getLocalizedText(attributeValue.attributeTitle, locale)
    const value =
      attributeValue.type === "BOOLEAN"
        ? attributeValue.valueBool === null
          ? ""
          : attributeValue.valueBool
            ? copy.yes
            : copy.no
        : attributeValue.type === "NUMBER"
          ? attributeValue.valueNumber === null
            ? ""
            : String(attributeValue.valueNumber)
          : (attributeValue.valueText ?? "")
    if (label && value) {
      rows.push({ label, value })
    }
  }

  // Free-form display-only specs.
  for (const [label, value] of Object.entries(item.specs)) {
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

/**
 * The slug that deep-links to a single variant's "variant product" page.
 * Prefers the explicit `slugOverride`; falls back to the joined option slugs
 * (e.g. `iphone-11`) so a category-bound variant is still addressable even when
 * the admin didn't set a dedicated variant slug. Returns null if neither exists.
 */
export function getVariantRouteSlug(
  variant: Pick<ShopVariant, "slugOverride" | "selectedOptions">,
): string | null {
  if (variant.slugOverride) {
    return variant.slugOverride
  }
  const optionSlugs = variant.selectedOptions.map((option) => option.optionSlug).filter(Boolean)
  return optionSlugs.length > 0 ? optionSlugs.join("-") : null
}

export function selectProductVariantByRoute(item: ShopItem, variantSlug?: string): ShopVariant | null {
  if (variantSlug) {
    return (
      item.variants.find((variant) => variant.slugOverride === variantSlug) ??
      item.variants.find((variant) => getVariantRouteSlug(variant) === variantSlug) ??
      null
    )
  }

  return selectProductVariant(item)
}

/**
 * Title for a card/page that represents one concrete variant (an
 * `ItemVariantCategory` card, or the detail page opened at a variant slug).
 * Joins the item title with the variant title, but avoids duplication when the
 * variant title already carries the item context (e.g. "Glass for iPhone 11").
 */
export function getVariantProductTitle(
  item: Pick<ShopItem, "title">,
  variant: Pick<ShopVariant, "title">,
  locale: ShopLocale,
): string {
  const itemTitle = getLocalizedText(item.title, locale).trim()
  const variantTitle = getLocalizedText(variant.title, locale).trim()
  if (!variantTitle) return itemTitle
  if (!itemTitle) return variantTitle

  const it = itemTitle.toLowerCase()
  const vt = variantTitle.toLowerCase()
  if (vt.includes(it) || it.includes(vt)) {
    return variantTitle.length >= itemTitle.length ? variantTitle : itemTitle
  }
  return `${itemTitle} ${variantTitle}`
}

/**
 * Build a catalog card for an item.
 *
 * `forcedVariantId` makes the card represent one concrete variant — used for
 * `ItemVariantCategory` rows in a category listing (PUBLIC_API_DOCS §2.4). Such
 * a card is always single-variant: the variant's real price (no "from X"), its
 * own title/image/slug, and a quick-buy button.
 */
export function toProductCard(
  item: ShopItem,
  locale: ShopLocale,
  forcedVariantId?: string,
): ShopProductCardView {
  const forcedVariant = forcedVariantId
    ? item.variants.find((candidate) => candidate.id === forcedVariantId) ?? null
    : null
  const variant = forcedVariant ?? selectProductVariant(item)
  const hasOptions = forcedVariant === null && item.variants.length > 1

  // Prefer the cheapest in-stock variant for the "from" price so the card never
  // advertises a price the customer cannot actually buy. A forced variant prices
  // itself, since the card is that one variant.
  const purchasableVariants = item.variants.filter(isVariantPurchasable)
  const pricePool = purchasableVariants.length > 0 ? purchasableVariants : item.variants
  const displayPrice = forcedVariant
    ? (forcedVariant.salePrice ?? forcedVariant.price)
    : Math.min(...pricePool.map((candidate) => candidate.salePrice ?? candidate.price))

  // A discount badge only makes sense for a single price point; "from X"
  // products span several prices and get no struck-through compare-at.
  const compareAtPrice = !hasOptions && variant.salePrice !== null ? variant.price : null
  const discountPercent =
    compareAtPrice !== null && compareAtPrice > 0
      ? Math.round(((compareAtPrice - displayPrice) / compareAtPrice) * 100)
      : null

  // Gallery images for the card: selected variant first, then the item-level
  // images, deduped. Lets the card preview a second photo on hover.
  const cardImages = Array.from(new Set([...variant.images, ...item.images])).filter(Boolean)
  const images = cardImages.length > 0 ? cardImages : ["/tech-fix-storefront.png"]

  // A forced-variant card shows the variant's own title and deep-links to its
  // variant detail page so the customer lands on exactly this model.
  const variantRouteSlug = forcedVariant ? getVariantRouteSlug(forcedVariant) : null
  const href =
    forcedVariant && variantRouteSlug
      ? `/${locale}/product/${item.slug}/${variantRouteSlug}`
      : `/${locale}/product/${item.slug}`

  return {
    itemId: item.id,
    variantId: variant.id,
    slug: item.slug,
    variantSlug: variant.slugOverride,
    title: forcedVariant ? getVariantProductTitle(item, variant, locale) : getLocalizedText(item.title, locale),
    image: images[0],
    images,
    price: variant.price,
    salePrice: variant.salePrice,
    displayPrice,
    priceFrom: hasOptions,
    compareAtPrice,
    discountPercent: discountPercent && discountPercent > 0 ? discountPercent : null,
    currency: "CZK",
    href,
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
    .map((link) => {
      const target = mockShopItems.find((product) => product.slug === link.targetSlug)
      return target ? { linkType: link.type, product: toProductCard(target, locale) } : null
    })
    .filter((entry): entry is ShopProductData["relatedItems"][number] => entry !== null)

  return { item, selectedVariant, relatedItems, isVariantView: Boolean(variantSlug) }
}

export function getAllMockShopProducts(locale: ShopLocale): ShopProductCardView[] {
  return mockShopItems.map((item) => toProductCard(item, locale))
}
