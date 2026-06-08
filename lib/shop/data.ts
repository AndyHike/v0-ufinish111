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
  selectProductVariant,
  selectProductVariantByRoute,
  toProductCard,
} from "./catalog"
import type {
  ShopCategoryData,
  ShopCategoryTreeNode,
  ShopCreatedOrder,
  ShopCreateOrderInput,
  ShopCurrency,
  ShopFilterAttribute,
  ShopHomeData,
  ShopIntegrations,
  ShopLocale,
  ShopOrderPayment,
  ShopPacketaConfig,
  ShopProductCardView,
  ShopProductData,
  ShopRelatedProduct,
  ShopStripeConfig,
  ShopVariant,
} from "./types"

const DISABLED_PACKETA: ShopPacketaConfig = {
  enabled: false,
  widgetApiKey: null,
  countries: [],
  services: [],
  defaultWeightKg: null,
  shippingPrice: null,
  freeShippingThreshold: null,
}

const DISABLED_STRIPE: ShopStripeConfig = { enabled: false }

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
    // Facet options/counts are derived from the attribute values of the active
    // items in this category, so they change on `item.*` / `collection.*` events
    // (tags: collection:{slug}, view:list:{slug}) — not only on attribute-definition
    // edits (`filters.updated` → filtersTag). Tag with all three so an item value
    // change in the category also revalidates this read, matching the items list.
    const apiFilters = await shopApiFetch<ApiFilterAttribute[]>("filters", {
      searchParams: { categorySlug: slug, locale },
      tags: tagsFor((id) => [filtersTag(id), collectionTag(id, slug), listViewTag(id, slug)]),
    })
    return apiFilters
      .map(mapApiFilterAttribute)
      .filter((attribute): attribute is ShopFilterAttribute => attribute !== null)
      // SELECT facets are useless with no present options, but BOOLEAN facets
      // legitimately carry no `options` (filtered via `bool=<key>:true|false`,
      // rendered as a single toggle), so keep them.
      .filter((attribute) => attribute.type === "BOOLEAN" || attribute.options.length > 0)
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

// ---- Integrations (Packeta delivery + Stripe payments) ---------------------

export async function getShopIntegrations(): Promise<ShopIntegrations> {
  if (!isShopApiEnabled()) {
    return { packeta: DISABLED_PACKETA, stripe: DISABLED_STRIPE }
  }
  try {
    const data = await shopApiFetch<{
      delivery?: { packeta?: Partial<ShopPacketaConfig> }
      payments?: { stripe?: { enabled?: boolean; publishableKey?: string | null } }
    }>("integrations", {
      tags: tagsFor((id) => [siteTag(id)]),
    })
    const packeta = data.delivery?.packeta
    const stripe = data.payments?.stripe
    return {
      packeta: packeta
        ? {
            enabled: Boolean(packeta.enabled),
            widgetApiKey: packeta.widgetApiKey ?? null,
            countries: packeta.countries ?? [],
            services: packeta.services ?? [],
            defaultWeightKg: packeta.defaultWeightKg ?? null,
            shippingPrice: packeta.shippingPrice ?? null,
            freeShippingThreshold: packeta.freeShippingThreshold ?? null,
          }
        : DISABLED_PACKETA,
      // Only treat Stripe as enabled when the admin actually returns a
      // publishable key — the browser needs it to load Stripe.js.
      stripe:
        stripe?.enabled && stripe.publishableKey
          ? { enabled: true, publishableKey: stripe.publishableKey }
          : DISABLED_STRIPE,
    }
  } catch (error) {
    console.error(`[shop] integrations request failed: ${String(error)}`)
    return { packeta: DISABLED_PACKETA, stripe: DISABLED_STRIPE }
  }
}

// ---- Checkout order flow ---------------------------------------------------
// These back the same-origin proxy routes under app/api/shop/orders/*. They run
// the secret/master key server-side so it never reaches the browser; the browser
// only ever holds the returned orderId + publicToken (a per-order capability
// token) and the merchant Stripe clientSecret/publishableKey.

// Loose shape of the serialized order returned by POST /orders.
interface ApiSerializedOrder {
  id: string
  orderNumber?: string | null
  status?: string
  paymentStatus?: string
  fulfillmentStatus?: string
  currency?: string
  totalAmount?: number
  reservationExpiresAt?: string | null
  paymentExpiresAt?: string | null
}

export async function createShopOrder(input: ShopCreateOrderInput): Promise<ShopCreatedOrder> {
  const data = await shopApiFetch<{ order: ApiSerializedOrder; publicToken: string }>("orders", {
    method: "POST",
    body: input,
  })
  const order = data.order
  return {
    orderId: order.id,
    publicToken: data.publicToken,
    orderNumber: order.orderNumber ?? null,
    totalAmount: order.totalAmount ?? 0,
    currency: (order.currency as ShopCurrency) ?? input.currency,
    reservationExpiresAt: order.reservationExpiresAt ?? null,
  }
}

export async function payShopOrder(orderId: string, publicToken: string): Promise<ShopOrderPayment> {
  return shopApiFetch<ShopOrderPayment>(`orders/${encodeURIComponent(orderId)}/pay`, {
    method: "POST",
    body: { publicToken },
  })
}

// Order status is no longer polled: the buyer's UX comes from Stripe's
// client-side confirm result, and the order's PAID/confirm transition is owned
// by the admin Stripe webhook (source of truth). No GET /orders/[id] fetcher.

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

  // The listing is a mixed stream (PUBLIC_API_DOCS §2.4): plain item rows plus
  // standalone `ItemVariantCategory` variant rows. A `rowType: "variant"` row
  // renders as the single matched variant rather than the item's "from X" card.
  const rows = apiItems.map((apiItem) => ({
    item: mapApiItem(apiItem),
    forcedVariantId: apiItem.rowType === "variant" ? apiItem.matchedVariantId ?? undefined : undefined,
  }))
  const toCard = (row: (typeof rows)[number]) => toProductCard(row.item, locale, row.forcedVariantId)

  const unfilteredProducts = rows.map(toCard)
  const attributeFiltered = rows
    .filter((row) => itemMatchesAttributes(row.item, activeFilters.attributes))
    .map(toCard)

  // Prefer live facets; fall back to client-side aggregation if `/filters` is
  // unavailable or empty so the panel still renders.
  const liveFacets = await filtersPromise
  const filterAttributes =
    liveFacets.length > 0 ? liveFacets : buildShopFilterFacets(rows.map((row) => row.item), locale)

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

  // Decide which variant the page represents and whether it is a standalone
  // "variant product" view:
  //  - explicit /product/{item}/{variantSlug}  → match by slug/option slug
  //  - canonical /product/{variantSlug} resolved server-side → selectedVariantId
  //  - otherwise the default variant, full item view (picker shown)
  let selectedVariant: ShopVariant | null
  let isVariantView: boolean
  if (variantSlug) {
    selectedVariant = selectProductVariantByRoute(item, variantSlug)
    if (!selectedVariant) {
      return null
    }
    isVariantView = true
  } else {
    const apiSelected = apiItem.selectedVariantId
      ? item.variants.find((variant) => variant.id === apiItem.selectedVariantId) ?? null
      : null
    selectedVariant = apiSelected ?? selectProductVariant(item)
    isVariantView = apiSelected !== null
  }

  // Resolve linked items into cards (best-effort; ignore individual failures).
  // Each card keeps its link type so the product page can group cross-sell /
  // accessory / upsell / related into labelled sections.
  const relatedItems = (
    await Promise.all(
      item.linkedItems.map(async (link) => {
        try {
          const target = await shopApiFetch<ApiItem>(`items/${link.targetSlug}`, {
            searchParams: { include: "variants,availability" },
            tags: tagsFor((id) => [viewHomeTag(id), availabilityTag(id)]),
          })
          return { linkType: link.type, product: toProductCard(mapApiItem(target), locale) }
        } catch {
          return null
        }
      }),
    )
  ).filter((entry): entry is ShopRelatedProduct => entry !== null)

  return { item, selectedVariant, relatedItems, isVariantView }
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
