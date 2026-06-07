import "server-only"

import { isShopApiEnabled, shopAdminStoreId } from "./api/config"
import { ShopApiError, shopApiFetch } from "./api/client"
import { type ApiCategory, type ApiItem, mapApiCategory, mapApiItem } from "./api/mappers"
import {
  availabilityTag,
  collectionTag,
  filtersTag,
  listViewTag,
  viewHomeTag,
  viewTag,
} from "./api/tags"
import {
  applyShopCategoryFilters,
  buildShopCategoryTree,
  buildShopFilterFacets,
  getLocalizedText,
  getMockShopCategory,
  getMockShopHomeData,
  getMockShopProduct,
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
import { mockShopCategories, mockShopItems, SHOP_LOCALES } from "./mock-data"
import type {
  ShopCategoryData,
  ShopHomeData,
  ShopItem,
  ShopLocale,
  ShopProductCardView,
  ShopProductData,
} from "./types"

const HOME_ITEMS_LIMIT = 12
const CATEGORY_ITEMS_LIMIT = 100
const SEARCH_LIMIT = 8

function isNotFound(error: unknown): boolean {
  return error instanceof ShopApiError && error.status === 404
}

// Cache tags are only useful when we know the storeId (to match the admin
// webhook's `site:{storeId}:...` tags). Without it, reads stay untagged and we
// rely on time-based ISR + path-based revalidation.
const storeId = shopAdminStoreId

function tagsFor(build: (id: string) => string[]): string[] | undefined {
  return storeId ? build(storeId) : undefined
}

// A misconfigured or unreachable admin API must never crash the build/render.
// We log loudly and fall back to mock data so deploys succeed and the site stays
// up; fix the env (STORE_NOT_FOUND usually means a wrong SHOP_ADMIN_DOMAIN/key).
function logApiFailure(scope: string, error: unknown): void {
  const detail = error instanceof ShopApiError ? `${error.status} ${error.code ?? ""} ${error.message}` : String(error)
  console.error(`[shop] API request failed (${scope}); falling back to mock data: ${detail.trim()}`)
}

async function fetchAllApiCategories(): Promise<ApiCategory[]> {
  // The categories list feeds the home/sidebar tree; it changes on any
  // category mutation, which the admin maps to `view:home`.
  return shopApiFetch<ApiCategory[]>("categories", {
    searchParams: { include: "seo" },
    tags: tagsFor((id) => [viewHomeTag(id)]),
  })
}

// ---- Home ------------------------------------------------------------------

export async function getShopHomeData(locale: ShopLocale): Promise<ShopHomeData> {
  if (!isShopApiEnabled()) {
    return getMockShopHomeData(locale)
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
      hero: getMockShopHomeData(locale).hero,
      categories: getRootShopCategories(categories),
      categoryTree: buildShopCategoryTree(categories),
      featuredProducts: items.map((item) => toProductCard(item, locale)),
    }
  } catch (error) {
    logApiFailure("home", error)
    return getMockShopHomeData(locale)
  }
}

// ---- Category --------------------------------------------------------------

export async function getShopCategoryData(
  locale: ShopLocale,
  slug: string,
  filterInput: ShopCategoryFilterInput = {},
): Promise<ShopCategoryData | null> {
  if (!isShopApiEnabled()) {
    return getMockShopCategory(locale, slug, filterInput)
  }

  const activeFilters = normalizeShopCategoryFilters(filterInput)

  try {
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

    const [allApiCategories, apiItems] = await Promise.all([
      fetchAllApiCategories(),
      shopApiFetch<ApiItem[]>("items", {
        searchParams: { categorySlug: slug, include: "variants,availability,categories", limit: CATEGORY_ITEMS_LIMIT },
        // collection/list tags for this category, plus availability (stock) and
        // filters (facets derive from attributes).
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

    return {
      category,
      children: getShopCategoryChildren(category.id, allCategories),
      ancestors: getShopCategoryAncestors(category, allCategories),
      categoryTree: buildShopCategoryTree(allCategories),
      priceBounds: getShopCategoryPriceBounds(unfilteredProducts),
      filterAttributes: buildShopFilterFacets(items, locale),
      activeFilters,
      products: applyShopCategoryFilters(attributeFiltered, activeFilters),
    }
  } catch (error) {
    logApiFailure(`category:${slug}`, error)
    return getMockShopCategory(locale, slug, filterInput)
  }
}

// ---- Product ---------------------------------------------------------------

export async function getShopProductData(
  locale: ShopLocale,
  itemSlug: string,
  variantSlug?: string,
): Promise<ShopProductData | null> {
  if (!isShopApiEnabled()) {
    return getMockShopProduct(locale, itemSlug, variantSlug)
  }

  try {
    let apiItem: ApiItem
    try {
      // The item's collectionKey (primary category slug) isn't known before the
      // fetch, so we use view:home (always sent on item.* changes) + availability.
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
  } catch (error) {
    logApiFailure(`product:${itemSlug}`, error)
    return getMockShopProduct(locale, itemSlug, variantSlug)
  }
}

// ---- Search ----------------------------------------------------------------

export async function searchShopProducts(
  locale: ShopLocale,
  query: string,
  limit = SEARCH_LIMIT,
): Promise<ShopProductCardView[]> {
  const normalized = query.trim()
  if (normalized.length === 0) {
    return []
  }

  const mockSearch = () => {
    const lower = normalized.toLowerCase()
    return mockShopItems
      .filter((item: ShopItem) => getLocalizedText(item.title, locale).toLowerCase().includes(lower))
      .slice(0, limit)
      .map((item) => toProductCard(item, locale))
  }

  if (!isShopApiEnabled()) {
    return mockSearch()
  }

  try {
    const apiItems = await shopApiFetch<ApiItem[]>("items", {
      searchParams: { search: normalized, include: "variants,availability", limit },
      revalidate: 0,
    })
    return apiItems.map(mapApiItem).map((item) => toProductCard(item, locale))
  } catch (error) {
    logApiFailure("search", error)
    return mockSearch()
  }
}

// ---- Static params (build-time slug enumeration) ---------------------------

export async function getShopCategorySlugParams(): Promise<{ locale: ShopLocale; slug: string }[]> {
  if (!isShopApiEnabled()) {
    return SHOP_LOCALES.flatMap((locale) =>
      mockShopCategories.filter((category) => category.isActive).map((category) => ({ locale, slug: category.slug })),
    )
  }

  try {
    const categories = await fetchAllApiCategories()
    const active = categories.filter((category) => category.isActive !== false)
    return SHOP_LOCALES.flatMap((locale) => active.map((category) => ({ locale, slug: category.slug })))
  } catch {
    return []
  }
}

export async function getShopProductSlugParams(): Promise<{ locale: ShopLocale; slugs: string[] }[]> {
  if (!isShopApiEnabled()) {
    return SHOP_LOCALES.flatMap((locale) =>
      mockShopItems.flatMap((item) => [
        { locale, slugs: [item.slug] },
        ...item.variants
          .filter((variant) => Boolean(variant.slugOverride))
          .map((variant) => ({ locale, slugs: [item.slug, variant.slugOverride as string] })),
      ]),
    )
  }

  try {
    const apiItems = await shopApiFetch<ApiItem[]>("items", {
      searchParams: { include: "variants", limit: 1000 },
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
