export type ShopLocale = "cs" | "uk" | "en"
export type ShopCurrency = "CZK"
export type ShopAvailability = "in_stock" | "out_of_stock" | "preorder" | "backorder"

export interface ShopLocalizedText {
  cs?: string
  uk?: string
  en?: string
}

export interface ShopStructuredVariantFacts {
  id: string
  slug: string
  title: string
  canonicalUrl: string
  price: number
  salePrice: number | null
  currency: ShopCurrency
  sku: string
  barcode?: string
  gtin?: string
  mpn?: string
  availability: ShopAvailability
}

export interface ShopStructuredDataFacts {
  kind: "product" | "category" | "home"
  schemaType: "Product" | "ProductGroup" | "CollectionPage" | "WebPage"
  canonicalUrl: string
  name: string
  description?: string
  image?: string
  brand?: string
  condition?: "new" | "used" | "refurbished"
  price?: number
  salePrice?: number | null
  currency?: ShopCurrency
  sku?: string
  barcode?: string
  gtin?: string
  mpn?: string
  availability?: ShopAvailability
  variants?: ShopStructuredVariantFacts[]
}

export interface ShopSeoLocale {
  metaTitle: string
  metaDescription: string | null
  ogTitle: string
  ogDescription: string | null
  ogImage: string | null
  canonicalUrl: string
  robots: string
  indexable: boolean
  structuredDataFacts: ShopStructuredDataFacts
  structuredData: Record<string, unknown>
  warnings: string[]
}

export interface ShopSeo {
  profile: "PRODUCT_DETAIL" | "CATEGORY_LISTING" | "SHOP_HOME"
  schemaType: "Product" | "ProductGroup" | "CollectionPage" | "WebPage"
  indexable: boolean
  robots: string
  canonicalPathHint: string
  canonicalUrl: string
  locales: Partial<Record<ShopLocale, ShopSeoLocale>>
}

export interface ShopCategory {
  id: string
  parentId: string | null
  title: ShopLocalizedText
  slug: string
  description: ShopLocalizedText
  imageUrl: string | null
  position: number
  isActive: boolean
  seo: ShopSeo
}

export interface ShopVariantOption {
  /** Stable attribute key id from the API; absent on older payloads. */
  attributeKeyId?: string
  attributeSlug: string
  attributeTitle: ShopLocalizedText
  optionSlug: string
  optionTitle: ShopLocalizedText
}

export type ShopAttributeValueType = "TEXT" | "NUMBER" | "BOOLEAN"

/** A single option of a structured SELECT attribute on an item. */
export interface ShopItemAttributeOption {
  optionId: string
  optionSlug: string
  optionTitle: ShopLocalizedText
}

/**
 * Structured, dictionary-backed SELECT attribute on an item (e.g. Color → Gray).
 * Grouped by attribute; filterable via `/items?attr=`.
 */
export interface ShopItemAttribute {
  attributeKeyId: string
  attributeSlug: string
  attributeTitle: ShopLocalizedText
  options: ShopItemAttributeOption[]
}

/** Typed scalar attribute value (TEXT / NUMBER / BOOLEAN); filterable via `?num=`/`?bool=`. */
export interface ShopItemAttributeValue {
  attributeKeyId: string
  attributeSlug: string
  attributeTitle: ShopLocalizedText
  type: ShopAttributeValueType
  valueText: string | null
  valueNumber: number | null
  valueBool: boolean | null
}

export interface ShopVariant {
  id: string
  itemId: string
  title: ShopLocalizedText
  slugOverride: string | null
  price: number
  salePrice: number | null
  sku: string
  barcode?: string
  gtin?: string
  mpn?: string
  isDefault: boolean
  trackInventory: boolean
  selectedOptions: ShopVariantOption[]
  images: string[]
  availability: {
    availableStock: number | null
  }
}

export interface ShopItem {
  id: string
  title: ShopLocalizedText
  slug: string
  description: ShopLocalizedText
  content: ShopLocalizedText
  images: string[]
  brand?: string
  condition?: "new" | "used" | "refurbished"
  /** Structured, filterable SELECT attributes (grouped). Source of the filter UI together with `/filters`. */
  attributes: ShopItemAttribute[]
  /** Typed scalar attribute values (TEXT / NUMBER / BOOLEAN). */
  attributeValues: ShopItemAttributeValue[]
  /** Free-form, display-only specs ("key" → "value"); never filtered. */
  specs: Record<string, string>
  categories: ShopCategory[]
  variants: ShopVariant[]
  linkedItems: Array<{
    type: "cross_sell" | "upsell" | "accessory" | "related"
    targetSlug: string
  }>
  seo: ShopSeo
}

export interface ShopProductCardView {
  itemId: string
  variantId: string
  slug: string
  variantSlug: string | null
  title: string
  image: string
  /** All gallery images (main first), deduped. Cards use these for hover/preview. */
  images: string[]
  price: number
  salePrice: number | null
  /** Prominent price shown on the card: lowest in-stock variant price. */
  displayPrice: number
  /** True when the item has multiple variants, so the price reads "from X". */
  priceFrom: boolean
  /** Original price to strike through (single-variant sale only); null otherwise. */
  compareAtPrice: number | null
  /** Rounded discount percentage for a single-variant sale; null otherwise. */
  discountPercent: number | null
  currency: ShopCurrency
  href: string
  availabilityLabel: string
  availableStock: number | null
  isPurchasable: boolean
}

export interface ShopCategoryTreeNode {
  category: ShopCategory
  children: ShopCategoryTreeNode[]
}

export type ShopCategorySortMode = "recommended" | "price-asc" | "price-desc"

// Attribute filter facet, shaped to match GET /api/public/v1/filters response.
export interface ShopFilterOption {
  /** optionId (`copt_...`) — passed to `/items?attr=` for server-side filtering. */
  id: string
  /** optionSlug — used in URLs / checkbox values. */
  slug: string
  value: string
  count: number
}

export interface ShopFilterAttribute {
  /** Stable attribute key id (= attributeKeyId); passed to `/items?attr=`. */
  id: string
  attributeKeyId: string
  /** Human attribute code (e.g. `color`); used in URLs (`attr_<slug>`). */
  slug: string
  name: string
  type: "SELECT" | "TEXT" | "NUMBER" | "BOOLEAN"
  /** True when the attribute defines variants (size/color) rather than a plain spec. */
  isVariantDefining: boolean
  options: ShopFilterOption[]
}

export interface ShopCategoryFilters {
  sort: ShopCategorySortMode
  minPrice: number | null
  maxPrice: number | null
  // attributeSlug -> selected option slugs
  attributes: Record<string, string[]>
}

export interface ShopCategoryPriceBounds {
  min: number | null
  max: number | null
}

export interface ShopHomeData {
  hero: {
    locale: ShopLocale
    title: string
    description: string
    image: string
  }
  categories: ShopCategory[]
  categoryTree: ShopCategoryTreeNode[]
  featuredProducts: ShopProductCardView[]
}

export interface ShopCategoryData {
  category: ShopCategory
  children: ShopCategory[]
  ancestors: ShopCategory[]
  categoryTree: ShopCategoryTreeNode[]
  priceBounds: ShopCategoryPriceBounds
  filterAttributes: ShopFilterAttribute[]
  activeFilters: ShopCategoryFilters
  products: ShopProductCardView[]
}

/** A linked product card together with the relationship that produced it. */
export interface ShopRelatedProduct {
  linkType: ShopItem["linkedItems"][number]["type"]
  product: ShopProductCardView
}

export interface ShopProductData {
  item: ShopItem
  selectedVariant: ShopVariant
  relatedItems: ShopRelatedProduct[]
  /**
   * The page represents one specific variant (opened via a variant slug or the
   * API's `selectedVariantId`): render it as a standalone product — combined
   * title, variant picker hidden.
   */
  isVariantView: boolean
}

export interface ShopPacketaConfig {
  enabled: boolean
  widgetApiKey: string | null
  countries: string[]
  services: string[]
  defaultWeightKg: number | null
}

export type ShopStripeConfig = { enabled: false } | { enabled: true; publishableKey: string }

export interface ShopIntegrations {
  packeta: ShopPacketaConfig
  stripe: ShopStripeConfig
}

// ---- Checkout order flow (POST /orders → /pay → poll) ----------------------

export interface ShopOrderLineInput {
  variantId: string
  quantity: number
}

export interface ShopOrderCustomerInput {
  name: string
  email?: string
  phone?: string
}

export interface ShopOrderDeliveryPoint {
  name: string
  city?: string
  country?: string
}

export interface ShopOrderDeliveryInput {
  provider: "PACKETA"
  service: "PICKUP_POINT" | "ZBOX" | "CARRIER_PUDO" | "HOME_DELIVERY"
  addressId: string | null
  point: ShopOrderDeliveryPoint
}

export interface ShopCreateOrderInput {
  customer: ShopOrderCustomerInput
  delivery: ShopOrderDeliveryInput
  lines: ShopOrderLineInput[]
  currency: ShopCurrency
  locale: ShopLocale
  note?: string
}

export interface ShopCreatedOrder {
  orderId: string
  publicToken: string
  orderNumber: string | null
  totalAmount: number
  currency: ShopCurrency
  reservationExpiresAt: string | null
}

export interface ShopOrderPayment {
  /** Null for free orders (total 0): settled server-side, no Stripe charge. */
  clientSecret: string | null
  publishableKey: string | null
  /** True when the order total was 0 and was settled without a Stripe payment. */
  free?: boolean
}

export type ShopPaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "PARTIALLY_REFUNDED" | string

export interface ShopOrderStatus {
  paymentStatus: ShopPaymentStatus
  status: string
  fulfillmentStatus: string
  paymentExpiresAt: string | null
  reservationExpiresAt: string | null
}
