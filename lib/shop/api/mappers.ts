import "server-only"

import { shopSiteUrl } from "../../site-config"
import type {
  ShopCategory,
  ShopItem,
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
  attributeSlug?: string
  attributeTitle?: ShopLocalizedText
  optionSlug?: string
  optionTitle?: ShopLocalizedText
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
  targetItem?: { slug?: string }
}

export interface ApiItem {
  id: string
  title?: ShopLocalizedText
  slug: string
  description?: ShopLocalizedText | null
  content?: ShopLocalizedText | null
  images?: ApiImage[]
  brand?: string
  condition?: string
  categories?: ApiCategoryContext[]
  variants?: ApiVariant[]
  linkedItems?: ApiLinkedItem[]
  seo?: ApiSeo
  selectedVariantId?: string | null
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

export function mapApiVariant(api: ApiVariant, itemId: string): ShopVariant {
  const selectedOptions: ShopVariantOption[] = (api.selectedOptions ?? [])
    .filter((option) => option.attributeSlug && option.optionSlug)
    .map((option) => ({
      attributeSlug: option.attributeSlug as string,
      attributeTitle: toLocalized(option.attributeTitle),
      optionSlug: option.optionSlug as string,
      optionTitle: toLocalized(option.optionTitle),
    }))

  return {
    id: api.id,
    itemId: api.itemId ?? itemId,
    title: toLocalized(api.title),
    slugOverride: api.slugOverride ?? null,
    price: toNumber(api.price),
    salePrice: api.salePrice === null || api.salePrice === undefined ? null : toNumber(api.salePrice),
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
  const variants = (api.variants ?? []).map((variant) => mapApiVariant(variant, api.id))
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
    categories: (api.categories ?? []).map(mapApiCategoryContext),
    variants,
    linkedItems: (api.linkedItems ?? [])
      .filter((link) => link.type && LINKED_TYPES.has(link.type as never) && link.targetItem?.slug)
      .map((link) => ({
        type: link.type as ShopItem["linkedItems"][number]["type"],
        targetSlug: link.targetItem?.slug as string,
      })),
    seo: mapApiSeo(api.seo, {
      profile: "PRODUCT_DETAIL",
      schemaType: variants.length > 1 ? "ProductGroup" : "Product",
      name: localizedName(title, api.slug),
      buildCanonical,
    }),
  }
}
