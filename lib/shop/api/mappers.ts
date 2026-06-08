import "server-only"

import { shopSiteUrl } from "../../site-config"
import type {
  ShopAttributeValueType,
  ShopCategory,
  ShopFilterAttribute,
  ShopFilterOption,
  ShopItem,
  ShopItemAttribute,
  ShopItemAttributeValue,
  ShopLocale,
  ShopLocalizedText,
  ShopSeo,
  ShopSeoLocale,
  ShopVariant,
  ShopVariantOption,
} from "../types"

const SHOP_LOCALES: ShopLocale[] = ["cs", "uk", "en"]

// ---- Loose API shapes (defensive: most fields optional) --------------------

interface ApiImage {
  filePath?: string
  isMain?: boolean
  position?: number
}

interface ApiSelectedOption {
  attributeKeyId?: string
  attributeSlug?: string
  attributeTitle?: ShopLocalizedText
  optionSlug?: string
  optionTitle?: ShopLocalizedText
}

interface ApiItemAttributeOption {
  optionId?: string
  optionSlug?: string
  optionTitle?: ShopLocalizedText
}

interface ApiItemAttribute {
  attributeKeyId?: string
  attributeSlug?: string
  attributeTitle?: ShopLocalizedText
  options?: ApiItemAttributeOption[]
}

interface ApiItemAttributeValue {
  attributeKeyId?: string
  attributeSlug?: string
  attributeTitle?: ShopLocalizedText
  type?: string
  valueText?: string | null
  valueNumber?: number | null
  valueBool?: boolean | null
}

interface ApiFilterOption {
  id?: string
  slug?: string
  optionSlug?: string
  value?: string
  count?: number
}

export interface ApiFilterAttribute {
  id?: string
  attributeKeyId?: string
  slug?: string
  name?: string
  type?: string
  isVariantDefining?: boolean
  options?: ApiFilterOption[]
}

interface ApiVariant {
  id: string
  itemId?: string
  title?: ShopLocalizedText
  slugOverride?: string | null
  price?: string | number
  salePrice?: string | number | null
  sku?: string
  barcode?: string
  gtin?: string
  mpn?: string
  isDefault?: boolean
  trackInventory?: boolean
  selectedOptions?: ApiSelectedOption[]
  images?: ApiImage[]
  availability?: { availableStock?: number | null }
}

interface ApiCategoryContext {
  id: string
  title?: ShopLocalizedText
  slug: string
  parentId?: string | null
  position?: number
  imageUrl?: string | null
}

export interface ApiCategory extends ApiCategoryContext {
  description?: ShopLocalizedText | null
  isActive?: boolean
  seo?: ApiSeo
}

interface ApiLinkedItem {
  type?: string
  // Tolerate shape vari[ation]: nested `targetItem.slug` (documented), or a
  // flatter `targetSlug` / `slug`, so a minor backend shape change can't silently
  // drop related products.
  targetItem?: { slug?: string }
  targetSlug?: string
  slug?: string
}

export interface ApiItem {
  id: string
  title?: ShopLocalizedText
  slug: string
  // Item-level price; for a single-default-variant product the price lives here
  // and the default variant inherits it (see mapApiVariant).
  price?: string | number
  salePrice?: string | number | null
  description?: ShopLocalizedText | null
  content?: ShopLocalizedText | null
  images?: ApiImage[]
  brand?: string
  condition?: string
  attributes?: ApiItemAttribute[]
  attributeValues?: ApiItemAttributeValue[]
  specs?: Record<string, unknown> | null
  categories?: ApiCategoryContext[]
  variants?: ApiVariant[]
  linkedItems?: ApiLinkedItem[]
  seo?: ApiSeo
  selectedVariantId?: string | null
  // Category-listing discriminators (present only on `?categorySlug=` rows; see
  // PUBLIC_API_DOCS §2.4). `rowType: "variant"` + `matchedVariantId` mean the row
  // is a standalone `ItemVariantCategory` card built from `variants[matchedVariantId]`.
  rowType?: "item" | "variant"
  matchedVariantId?: string | null
}

interface ApiSeoLocale {
  metaTitle?: string
  metaDescription?: string | null
  ogTitle?: string
  ogDescription?: string | null
  ogImage?: string | null
  canonicalUrl?: string | null
  robots?: string
  indexable?: boolean
  structuredDataFacts?: ShopSeoLocale["structuredDataFacts"]
  structuredData?: Record<string, unknown>
  warnings?: string[]
}

interface ApiSeo {
  profile?: string
  schemaType?: string
  indexable?: boolean
  robots?: string
  canonicalPathHint?: string
  canonicalUrl?: string | null
  locales?: Partial<Record<ShopLocale, ApiSeoLocale>>
}

// ---- Primitive mappers -----------------------------------------------------

function toNumber(value: string | number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) {
    return fallback
  }
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toLocalized(value: ShopLocalizedText | null | undefined): ShopLocalizedText {
  return value ?? {}
}

function mapImages(images: ApiImage[] | undefined): string[] {
  if (!images || images.length === 0) {
    return []
  }
  return [...images]
    .sort((a, b) => {
      if (Boolean(b.isMain) !== Boolean(a.isMain)) {
        return Number(Boolean(b.isMain)) - Number(Boolean(a.isMain))
      }
      return (a.position ?? 0) - (b.position ?? 0)
    })
    .map((image) => image.filePath)
    .filter((path): path is string => Boolean(path))
}

function mapCondition(condition: string | undefined): ShopItem["condition"] {
  return condition === "new" || condition === "used" || condition === "refurbished" ? condition : undefined
}

const LINKED_TYPES = new Set<ShopItem["linkedItems"][number]["type"]>([
  "cross_sell",
  "upsell",
  "accessory",
  "related",
])

/** Normalize a link type defensively (case + dash/space) before matching. */
function normalizeLinkType(type: string | undefined): ShopItem["linkedItems"][number]["type"] | null {
  const normalized = type?.trim().toLowerCase().replace(/[\s-]+/g, "_")
  return normalized && LINKED_TYPES.has(normalized as never)
    ? (normalized as ShopItem["linkedItems"][number]["type"])
    : null
}

function mapLinkedItems(linkedItems: ApiLinkedItem[] | undefined): ShopItem["linkedItems"] {
  const mapped: ShopItem["linkedItems"] = []
  for (const link of linkedItems ?? []) {
    const type = normalizeLinkType(link.type)
    const targetSlug = link.targetItem?.slug ?? link.targetSlug ?? link.slug
    if (type && targetSlug) {
      mapped.push({ type, targetSlug })
    }
  }
  return mapped
}

// ---- SEO mapper ------------------------------------------------------------

function buildSeoLocale(
  apiLocale: ApiSeoLocale | undefined,
  opts: { canonicalUrl: string; name: string; robots: string; indexable: boolean; schemaType: ShopSeo["schemaType"] },
): ShopSeoLocale {
  const canonicalUrl = apiLocale?.canonicalUrl ?? opts.canonicalUrl
  return {
    metaTitle: apiLocale?.metaTitle ?? opts.name,
    metaDescription: apiLocale?.metaDescription ?? null,
    ogTitle: apiLocale?.ogTitle ?? apiLocale?.metaTitle ?? opts.name,
    ogDescription: apiLocale?.ogDescription ?? apiLocale?.metaDescription ?? null,
    ogImage: apiLocale?.ogImage ?? null,
    canonicalUrl,
    robots: apiLocale?.robots ?? opts.robots,
    indexable: apiLocale?.indexable ?? opts.indexable,
    structuredDataFacts:
      apiLocale?.structuredDataFacts ?? {
        kind: opts.schemaType === "CollectionPage" ? "category" : opts.schemaType === "WebPage" ? "home" : "product",
        schemaType: opts.schemaType,
        canonicalUrl,
        name: opts.name,
      },
    structuredData: apiLocale?.structuredData ?? {},
    warnings: apiLocale?.warnings ?? [],
  }
}

function mapApiSeo(
  apiSeo: ApiSeo | undefined,
  opts: {
    profile: ShopSeo["profile"]
    schemaType: ShopSeo["schemaType"]
    name: string
    buildCanonical: (locale: ShopLocale) => string
  },
): ShopSeo {
  const robots = apiSeo?.robots ?? "index,follow"
  const indexable = apiSeo?.indexable ?? true
  const defaultCanonical = apiSeo?.canonicalUrl ?? opts.buildCanonical("cs")

  const locales: Partial<Record<ShopLocale, ShopSeoLocale>> = {}
  for (const locale of SHOP_LOCALES) {
    locales[locale] = buildSeoLocale(apiSeo?.locales?.[locale], {
      canonicalUrl: opts.buildCanonical(locale),
      name: opts.name,
      robots,
      indexable,
      schemaType: opts.schemaType,
    })
  }

  return {
    profile: opts.profile,
    schemaType: opts.schemaType,
    indexable,
    robots,
    canonicalPathHint: apiSeo?.canonicalPathHint ?? "",
    canonicalUrl: defaultCanonical,
    locales,
  }
}

// ---- Attribute mappers -----------------------------------------------------

function mapItemAttributes(attributes: ApiItemAttribute[] | undefined): ShopItemAttribute[] {
  return (attributes ?? [])
    .filter((attribute) => attribute.attributeKeyId && attribute.attributeSlug)
    .map((attribute) => ({
      attributeKeyId: attribute.attributeKeyId as string,
      attributeSlug: attribute.attributeSlug as string,
      attributeTitle: toLocalized(attribute.attributeTitle),
      options: (attribute.options ?? [])
        .filter((option) => option.optionId && option.optionSlug)
        .map((option) => ({
          optionId: option.optionId as string,
          optionSlug: option.optionSlug as string,
          optionTitle: toLocalized(option.optionTitle),
        })),
    }))
}

function mapAttributeValueType(type: string | undefined): ShopAttributeValueType | null {
  return type === "TEXT" || type === "NUMBER" || type === "BOOLEAN" ? type : null
}

function mapItemAttributeValues(values: ApiItemAttributeValue[] | undefined): ShopItemAttributeValue[] {
  const mapped: ShopItemAttributeValue[] = []
  for (const value of values ?? []) {
    const type = mapAttributeValueType(value.type)
    if (!type || !value.attributeKeyId || !value.attributeSlug) {
      continue
    }
    mapped.push({
      attributeKeyId: value.attributeKeyId,
      attributeSlug: value.attributeSlug,
      attributeTitle: toLocalized(value.attributeTitle),
      type,
      valueText: value.valueText ?? null,
      valueNumber: typeof value.valueNumber === "number" ? value.valueNumber : null,
      valueBool: typeof value.valueBool === "boolean" ? value.valueBool : null,
    })
  }
  return mapped
}

/** Coerce the free-form `specs` object to a flat string→string map for display. */
function mapSpecs(specs: Record<string, unknown> | null | undefined): Record<string, string> {
  if (!specs || typeof specs !== "object") {
    return {}
  }
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(specs)) {
    if (value === null || value === undefined) {
      continue
    }
    out[key] = typeof value === "string" ? value : String(value)
  }
  return out
}

/** Map a single `/api/public/v1/filters` facet. The endpoint already localizes `name`/`value`. */
export function mapApiFilterAttribute(api: ApiFilterAttribute): ShopFilterAttribute | null {
  const attributeKeyId = api.attributeKeyId ?? api.id
  const slug = api.slug
  if (!attributeKeyId || !slug) {
    return null
  }

  const type: ShopFilterAttribute["type"] =
    api.type === "TEXT" || api.type === "NUMBER" || api.type === "BOOLEAN" ? api.type : "SELECT"

  const options: ShopFilterOption[] = (api.options ?? [])
    .map((option) => {
      const optionSlug = option.optionSlug ?? option.slug
      if (!option.id || !optionSlug) {
        return null
      }
      return {
        id: option.id,
        slug: optionSlug,
        value: option.value ?? optionSlug,
        count: typeof option.count === "number" ? option.count : 0,
      }
    })
    .filter((option): option is ShopFilterOption => option !== null)

  return {
    id: attributeKeyId,
    attributeKeyId,
    slug,
    name: api.name ?? slug,
    type,
    isVariantDefining: Boolean(api.isVariantDefining),
    options,
  }
}

// ---- Entity mappers --------------------------------------------------------

function localizedName(value: ShopLocalizedText | null | undefined, fallback: string): string {
  const text = value ?? {}
  return text.cs ?? text.uk ?? text.en ?? fallback
}

export function mapApiCategory(api: ApiCategory): ShopCategory {
  const title = toLocalized(api.title)
  const buildCanonical = (locale: ShopLocale) => `${shopSiteUrl}/${locale}/category/${api.slug}`
  return {
    id: api.id,
    parentId: api.parentId ?? null,
    title,
    slug: api.slug,
    description: toLocalized(api.description),
    imageUrl: api.imageUrl ?? null,
    position: api.position ?? 0,
    isActive: api.isActive ?? true,
    seo: mapApiSeo(api.seo, {
      profile: "CATEGORY_LISTING",
      schemaType: "CollectionPage",
      name: localizedName(title, api.slug),
      buildCanonical,
    }),
  }
}

/** Map the lightweight category context attached to items (`include=categories`). */
export function mapApiCategoryContext(api: ApiCategoryContext): ShopCategory {
  return mapApiCategory({ ...api, isActive: true })
}

export function mapApiVariant(
  api: ApiVariant,
  itemId: string,
  itemPrice?: string | number,
  itemSalePrice?: string | number | null,
): ShopVariant {
  const selectedOptions: ShopVariantOption[] = (api.selectedOptions ?? [])
    .filter((option) => option.attributeSlug && option.optionSlug)
    .map((option) => ({
      attributeKeyId: option.attributeKeyId,
      attributeSlug: option.attributeSlug as string,
      attributeTitle: toLocalized(option.attributeTitle),
      optionSlug: option.optionSlug as string,
      optionTitle: toLocalized(option.optionTitle),
    }))

  // Resolve price + salePrice as a PAIR from one source, mirroring the admin's
  // resolveVariantDisplay. A variant with its own price uses the variant's
  // price AND salePrice (no item fallback) — otherwise a priced variant would
  // show the item/default-variant sale. A variant without its own price (the
  // single-default-variant case, where price lives on the item) inherits the
  // item's price + salePrice instead of rendering 0.
  const usesVariantPrice = api.price !== null && api.price !== undefined
  const price = usesVariantPrice ? toNumber(api.price) : toNumber(itemPrice)
  const salePrice = usesVariantPrice
    ? api.salePrice === null || api.salePrice === undefined
      ? null
      : toNumber(api.salePrice)
    : itemSalePrice === null || itemSalePrice === undefined
      ? null
      : toNumber(itemSalePrice)

  return {
    id: api.id,
    itemId: api.itemId ?? itemId,
    title: toLocalized(api.title),
    slugOverride: api.slugOverride ?? null,
    price,
    salePrice,
    sku: api.sku ?? "",
    barcode: api.barcode,
    gtin: api.gtin,
    mpn: api.mpn,
    isDefault: api.isDefault ?? false,
    trackInventory: api.trackInventory ?? false,
    selectedOptions,
    images: mapImages(api.images),
    availability: { availableStock: api.availability?.availableStock ?? null },
  }
}

export function mapApiItem(api: ApiItem): ShopItem {
  const title = toLocalized(api.title)
  const variants = (api.variants ?? []).map((variant) =>
    mapApiVariant(variant, api.id, api.price, api.salePrice),
  )
  const buildCanonical = (locale: ShopLocale) => `${shopSiteUrl}/${locale}/product/${api.slug}`

  return {
    id: api.id,
    title,
    slug: api.slug,
    description: toLocalized(api.description),
    content: toLocalized(api.content),
    images: mapImages(api.images),
    brand: api.brand,
    condition: mapCondition(api.condition),
    attributes: mapItemAttributes(api.attributes),
    attributeValues: mapItemAttributeValues(api.attributeValues),
    specs: mapSpecs(api.specs),
    categories: (api.categories ?? []).map(mapApiCategoryContext),
    variants,
    linkedItems: mapLinkedItems(api.linkedItems),
    seo: mapApiSeo(api.seo, {
      profile: "PRODUCT_DETAIL",
      schemaType: variants.length > 1 ? "ProductGroup" : "Product",
      name: localizedName(title, api.slug),
      buildCanonical,
    }),
  }
}
