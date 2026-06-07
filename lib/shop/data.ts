import "server-only"

import { isShopApiEnabled, shopAdminStoreId } from "./api/config"
import { ShopApiError, shopApiFetch } from "./api/client"
import {
  type ApiCategory,
  type ApiFilterAttribute,
  type ApiItem,
  mapApiCategory,
  mapApiFilterAttribute,
  mapApiItem,
} from "./api/mappers"
import { availabilityTag, collectionTag, filtersTag, listViewTag, siteTag, viewHomeTag, viewTag } from "./api/tags"
import {
  applyShopCategoryFilters,
  buildShopCategoryTree,
  buildShopFilterFacets,
  getRootShopCategories,
  getShopCategoryAncestors,
  getShopCategoryChildren,
  getShopCategoryPriceBounds,
  itemMatchesAttributes,
  normalizeShopCategoryFilters,
  type ShopCategoryFilterInput,
  selectProductVariantByRoute,
  toProductCard,
} from "./catalog"
import type {
  ShopCategoryData,
  ShopCategoryTreeNode,
  ShopFilterAttribute,
  ShopHomeData,
  ShopIntegrations,
  ShopLocale,
  ShopPacketaConfig,
  ShopProductCardView,
  ShopProductData,
} from "./types"

const DISABLED_PACKETA: ShopPacketaConfig = {
  enabled: false,
  widgetApiKey: null,
  countries: [],
  services: [],
  defaultWeightKg: null,
}

const HOME_ITEMS_LIMIT = 12
const CATEGORY_ITEMS_LIMIT = 100
const SEARCH_LIMIT = 8
const SLUG_PARAMS_ITEMS_LIMIT = 1000
const SHOP_LOCALES: ShopLocale[] = ["cs", "uk", "en"]

function isNotFound(error: unknown): boolean {
  return error instanceof ShopApiError && error.status === 404
}

// Cache tags only match the admin webhook when we know the storeId. Without it,
// reads stay untagged and on-demand revalidation falls back to path-based.
const storeId = shopAdminStoreId

function tagsFor(build: (id: string) => string[]): string[] | undefined {
  return storeId ? build(storeId) : undefined
}

// Static hero copy (the visible hero is the carousel; this only feeds the
// sr-only heading and metadata). Kept here so the home page needs no mock data.
const HERO_COPY: Record<ShopLocale, { title: string; description: string }> = {
  cs: {
    title: "Premium prislusenstvi a dily pro telefony",
    description: "Vybrane produkty od servisniho tymu DeviceHelp.",
  },
  uk: {
    title: "Преміальні аксесуари та деталі для телефонів",
    description: "Підібрані товари від сервісної команди DeviceHelp.",
  },
  en: {
    title: "Premium phone accessories and parts",
    description: "Hand-picked products from the DeviceHelp service team.",
  },
}

function buildHero(locale: ShopLocale): ShopHomeData["hero"] {
  return { locale, title: HERO_COPY[locale].title, description: HERO_COPY[locale].description, image: "/tech-fix-storefront.png" }
}

const EMPTY_HOME = (locale: ShopLocale): ShopHomeData => ({
  hero: buildHero(locale),
  categories: [],
  categoryTree: [],
  featuredProducts: [],
})

async function fetchAllApiCategories(): Promise<ApiCategory[]> {
  return shopApiFetch<ApiCategory[]>("categories", {
    searchParams: { include: "seo" },
    tags: tagsFor((id) => [viewHomeTag(id)]),
  })
}

// Facet tree for a category from the live `/filters` endpoint (authoritative:
// honours admin attribute→category assignment, hides empty options, returns
// counts). Resilient: a failure yields [] so the caller can fall back to
// client-side aggregation rather than failing the whole page.
async function fetchCategoryFilters(slug: string, locale: ShopLocale): Promise<ShopFilterAttribute[]> {
  try {
    const apiFilters = await shopApiFetch<ApiFilterAttribute[]>("filters", {
      searchParams: { categorySlug: slug, locale },
      tags: tagsFor((id) => [filtersTag(id)]),
    })
    return apiFilters
      .map(mapApiFilterAttribute)
      .filter((attribute): attribute is ShopFilterAttribute => attribute !== null)
      .filter((attribute) => attribute.options.length > 0)
  } catch (error) {
    console.error(`[shop] filters request failed for ${slug}; falling back to client facets: ${String(error)}`)
    return []
  }
}

// ---- Category tree (header / sidebar) --------------------------------------

export async function getShopCategoryTree(): Promise<ShopCategoryTreeNode[]> {
  if (!isShopApiEnabled()) {
    return []
  }
  try {
    const categories = (await fetchAllApiCategories()).map(mapApiCategory)
    return buildShopCategoryTree(categories)
  } catch (error) {
    console.error(`[shop] category tree request failed: ${String(error)}`)
    return []
  }
}

// ---- Integrations (Packeta) ------------------------------------------------

export async function getShopIntegrations(): Promise<ShopIntegrations> {
  if (!isShopApiEnabled()) {
    return { packeta: DISABLED_PACKETA }
  }
  try {
    const data = await shopApiFetch<{ delivery?: { packeta?: Partial<ShopPacketaConfig> } }>("integrations", {
      tags: tagsFor((id) => [siteTag(id)]),
    })
    const packeta = data.delivery?.packeta
    return {
      packeta: packeta
        ? {
            enabled: Boolean(packeta.enabled),
            widgetApiKey: packeta.widgetApiKey ?? null,
            countries: packeta.countries ?? [],
            services: packeta.services ?? [],
            defaultWeightKg: packeta.defaultWeightKg ?? null,
          }
        : DISABLED_PACKETA,
    }
  } catch (error) {
    console.error(`[shop] integrations request failed: ${String(error)}`)
    return { packeta: DISABLED_PACKETA }
  }
}

// ---- Home ------------------------------------------------------------------

export async function getShopHomeData(locale: ShopLocale): Promise<ShopHomeData> {
  // Without API config there is no data source; render an empty shell rather
  // than mock content.
  if (!isShopApiEnabled()) {
    return EMPTY_HOME(locale)
  }

  try {
    const [apiCategories, apiItems] = await Promise.all([
      fetchAllApiCategories(),
      shopApiFetch<ApiItem[]>("items", {
        searchParams: { include: "variants,availability", limit: HOME_ITEMS_LIMIT },
        tags: tagsFor((id) => [viewHomeTag(id), availabilityTag(id)]),
      }),
    ])

    const categories = apiCategories.map(mapApiCategory)
    const items = apiItems.map(mapApiItem)

    return {
      hero: buildHero(locale),
      categories: getRootShopCategories(categories),
      categoryTree: buildShopCategoryTree(categories),
      featuredProducts: items.map((item) => toProductCard(item, locale)),
    }
  } catch (error) {
    // Keep the homepage up on a transient API failure: render an empty catalog
    // (never mock), don't hard-500.
    console.error(`[shop] home API request failed; rendering empty catalog: ${String(error)}`)
    return EMPTY_HOME(locale)
  }
}

// ---- Category --------------------------------------------------------------

export async function getShopCategoryData(
  locale: ShopLocale,
  slug: string,
  filterInput: ShopCategoryFilterInput = {},
): Promise<ShopCategoryData | null> {
  if (!isShopApiEnabled()) {
    return null
  }

  const activeFilters = normalizeShopCategoryFilters(filterInput)

  let apiCategory: ApiCategory
  try {
    apiCategory = await shopApiFetch<ApiCategory>(`categories/${slug}`, {
      tags: tagsFor((id) => [collectionTag(id, slug), viewTag(id, slug)]),
    })
  } catch (error) {
    if (isNotFound(error)) {
      return null
    }
    throw error
  }

  // Facets come from the live `/filters` endpoint (full category, authoritative
  // counts); kicked off in parallel with the catalog reads.
  const filtersPromise = fetchCategoryFilters(slug, locale)
  const [allApiCategories, apiItems] = await Promise.all([
    fetchAllApiCategories(),
    shopApiFetch<ApiItem[]>("items", {
      searchParams: { categorySlug: slug, include: "variants,availability,categories", limit: CATEGORY_ITEMS_LIMIT },
      tags: tagsFor((id) => [collectionTag(id, slug), listViewTag(id, slug), availabilityTag(id), filtersTag(id)]),
    }),
  ])

  const category = mapApiCategory(apiCategory)
  const allCategories = allApiCategories.map(mapApiCategory)
  const items = apiItems.map(mapApiItem)

  const unfilteredProducts = items.map((item) => toProductCard(item, locale))
  const attributeFiltered = items
    .filter((item) => itemMatchesAttributes(item, activeFilters.attributes))
    .map((item) => toProductCard(item, locale))

  // Prefer live facets; fall back to client-side aggregation if `/filters` is
  // unavailable or empty so the panel still renders.
  const liveFacets = await filtersPromise
  const filterAttributes = liveFacets.length > 0 ? liveFacets : buildShopFilterFacets(items, locale)

  return {
    category,
    children: getShopCategoryChildren(category.id, allCategories),
    ancestors: getShopCategoryAncestors(category, allCategories),
    categoryTree: buildShopCategoryTree(allCategories),
    priceBounds: getShopCategoryPriceBounds(unfilteredProducts),
    filterAttributes,
    activeFilters,
    products: applyShopCategoryFilters(attributeFiltered, activeFilters),
  }
}

// ---- Product ---------------------------------------------------------------

export async function getShopProductData(
  locale: ShopLocale,
  itemSlug: string,
  variantSlug?: string,
): Promise<ShopProductData | null> {
  if (!isShopApiEnabled()) {
    return null
  }

  let apiItem: ApiItem
  try {
    // collectionKey (primary category slug) isn't known before the fetch, so we
    // tag with view:home (always sent on item.* changes) + availability.
    apiItem = await shopApiFetch<ApiItem>(`items/${itemSlug}`, {
      searchParams: { include: "categories,variants,availability" },
      tags: tagsFor((id) => [viewHomeTag(id), availabilityTag(id)]),
    })
  } catch (error) {
    if (isNotFound(error)) {
      return null
    }
    throw error
  }

  const item = mapApiItem(apiItem)
  const selectedVariant = selectProductVariantByRoute(item, variantSlug)
  if (!selectedVariant) {
    return null
  }

  // Resolve linked items into cards (best-effort; ignore individual failures).
  const relatedItems = (
    await Promise.all(
      item.linkedItems.map(async (link) => {
        try {
          const target = await shopApiFetch<ApiItem>(`items/${link.targetSlug}`, {
            searchParams: { include: "variants,availability" },
            tags: tagsFor((id) => [viewHomeTag(id), availabilityTag(id)]),
          })
          return toProductCard(mapApiItem(target), locale)
        } catch {
          return null
        }
      }),
    )
  ).filter((card): card is ShopProductCardView => card !== null)

  return { item, selectedVariant, relatedItems }
}

// ---- Search ----------------------------------------------------------------

export async function searchShopProducts(
  locale: ShopLocale,
  query: string,
  limit = SEARCH_LIMIT,
): Promise<ShopProductCardView[]> {
  const normalized = query.trim()
  if (normalized.length === 0 || !isShopApiEnabled()) {
    return []
  }

  const apiItems = await shopApiFetch<ApiItem[]>("items", {
    searchParams: { search: normalized, include: "variants,availability", limit },
    revalidate: 0,
  })
  return apiItems.map(mapApiItem).map((item) => toProductCard(item, locale))
}

// ---- Static params (build-time slug enumeration; ISR) ----------------------
// On error or when the API isn't configured at build time, return [] so the
// build succeeds and pages render on demand at runtime (with env present).

export async function getShopCategorySlugParams(): Promise<{ locale: ShopLocale; slug: string }[]> {
  if (!isShopApiEnabled()) {
    return []
  }
  try {
    const categories = (await fetchAllApiCategories()).filter((category) => category.isActive !== false)
    return SHOP_LOCALES.flatMap((locale) => categories.map((category) => ({ locale, slug: category.slug })))
  } catch {
    return []
  }
}

export async function getShopProductSlugParams(): Promise<{ locale: ShopLocale; slugs: string[] }[]> {
  if (!isShopApiEnabled()) {
    return []
  }
  try {
    const apiItems = await shopApiFetch<ApiItem[]>("items", {
      searchParams: { include: "variants", limit: SLUG_PARAMS_ITEMS_LIMIT },
      tags: tagsFor((id) => [viewHomeTag(id)]),
    })
    const items = apiItems.map(mapApiItem)
    return SHOP_LOCALES.flatMap((locale) =>
      items.flatMap((item) => [
        { locale, slugs: [item.slug] },
        ...item.variants
          .filter((variant) => Boolean(variant.slugOverride))
          .map((variant) => ({ locale, slugs: [item.slug, variant.slugOverride as string] })),
      ]),
    )
  } catch {
    return []
  }
}
