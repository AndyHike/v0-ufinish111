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
  attributeSlug: string
  attributeTitle: ShopLocalizedText
  optionSlug: string
  optionTitle: ShopLocalizedText
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
  price: number
  salePrice: number | null
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

export interface ShopCategoryFilters {
  sort: ShopCategorySortMode
  minPrice: number | null
  maxPrice: number | null
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
  activeFilters: ShopCategoryFilters
  products: ShopProductCardView[]
}

export interface ShopProductData {
  item: ShopItem
  selectedVariant: ShopVariant
  relatedItems: ShopProductCardView[]
}
