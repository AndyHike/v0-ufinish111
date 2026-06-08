import Link from "next/link"

import { ProductCard } from "@/components/shop/product-card"
import { ProductGallery } from "@/components/shop/product-gallery"
import { ProductPurchasePanel } from "@/components/shop/product-purchase-panel"
import { StructuredData } from "@/components/shop/structured-data"
import { getLocalizedText, getProductSpecificationRows } from "@/lib/shop/catalog"
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/shop/seo"
import { shopSiteUrl } from "@/lib/site-config"
import type { ShopItem, ShopLocale, ShopRelatedProduct, ShopVariant } from "@/lib/shop/types"

const PRODUCT_COPY = {
  cs: {
    shop: "Shop",
    details: "Popis produktu",
    specifications: "Charakteristiky",
  },
  uk: {
    shop: "Shop",
    details: "Опис товару",
    specifications: "Характеристики",
  },
  en: {
    shop: "Shop",
    details: "Product description",
    specifications: "Specifications",
  },
} as const

// Headings per relationship type so linked products read as purposeful blocks
// ("frequently bought together" / accessories / …) rather than one generic list.
const RELATED_COPY = {
  cs: {
    cross_sell: "Casto kupuji spolu",
    accessory: "Prislusenstvi",
    upsell: "Mohlo by se vam libit",
    related: "Souvisejici produkty",
  },
  uk: {
    cross_sell: "Часто купують разом",
    accessory: "Аксесуари",
    upsell: "Вам може сподобатись",
    related: "Рекомендовані товари",
  },
  en: {
    cross_sell: "Frequently bought together",
    accessory: "Accessories",
    upsell: "You might also like",
    related: "Recommended products",
  },
} as const

const RELATED_ORDER = ["cross_sell", "accessory", "upsell", "related"] as const

export function ProductPage({
  locale,
  item,
  selectedVariant,
  relatedItems,
  variantView = false,
}: {
  locale: ShopLocale
  item: ShopItem
  selectedVariant: ShopVariant
  relatedItems: ShopRelatedProduct[]
  /** Page opened at a specific variant slug → present that variant as the product. */
  variantView?: boolean
}) {
  const copy = PRODUCT_COPY[locale]
  const relatedCopy = RELATED_COPY[locale]
  const relatedGroups = RELATED_ORDER.map((type) => ({
    type,
    title: relatedCopy[type],
    items: relatedItems.filter((entry) => entry.linkType === type).map((entry) => entry.product),
  })).filter((group) => group.items.length > 0)
  const title = getLocalizedText(item.title, locale)
  const category = item.categories[0]
  const specifications = getProductSpecificationRows(item, selectedVariant, locale)
  const productJsonLd = buildProductJsonLd(item, selectedVariant, locale)
  const breadcrumbItems = [
    { name: copy.shop, url: `${shopSiteUrl}/${locale}` },
    ...(category
      ? [
          {
            name: getLocalizedText(category.title, locale),
            url: `${shopSiteUrl}/${locale}/category/${category.slug}`,
          },
        ]
      : []),
    { name: title, url: item.seo.locales[locale]?.canonicalUrl ?? item.seo.canonicalUrl },
  ]
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, breadcrumbItems)

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-white text-gray-950">
      <StructuredData id="shop-product-jsonld" data={productJsonLd} />
      <StructuredData id="shop-product-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <div className="container min-w-0 px-4 py-8 md:px-6">
        <nav className="text-sm text-gray-500">
          <Link href={`/${locale}`} className="hover:text-gray-900">
            {copy.shop}
          </Link>
          {category ? (
            <>
              <span className="mx-2">/</span>
              <Link href={`/${locale}/category/${category.slug}`} className="hover:text-gray-900">
                {getLocalizedText(category.title, locale)}
              </Link>
            </>
          ) : null}
        </nav>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
          <div className="min-w-0">
            <ProductGallery images={selectedVariant.images.length ? selectedVariant.images : item.images} title={title} />
          </div>
          <div className="min-w-0">
            <ProductPurchasePanel
              locale={locale}
              item={{
                id: item.id,
                title: item.title,
                description: item.description,
                variants: item.variants,
                categories: item.categories,
              }}
              selectedVariant={selectedVariant}
              singleVariantView={variantView}
            />
          </div>
        </div>

        {/* Quick-jump nav bar: tabs sit centered between a top and bottom rule. */}
        <nav className="mt-10 border-y border-gray-200">
          <div className="flex justify-center gap-6 py-3">
            <a
              href="#shop-description"
              className="px-2 py-1 text-sm font-medium text-gray-700 underline-offset-8 transition hover:text-gray-950 hover:underline"
            >
              {copy.details}
            </a>
            <a
              href="#shop-specifications"
              className="px-2 py-1 text-sm font-medium text-gray-700 underline-offset-8 transition hover:text-gray-950 hover:underline"
            >
              {copy.specifications}
            </a>
          </div>
        </nav>

        <section id="shop-description" className="mt-10 scroll-mt-24">
          <h2 className="text-xl font-semibold">{copy.details}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600">{getLocalizedText(item.content, locale)}</p>
        </section>

        <section id="shop-specifications" className="mt-10 scroll-mt-24">
          <h2 className="text-xl font-semibold">{copy.specifications}</h2>
          <dl className="mt-4 max-w-3xl overflow-hidden rounded-lg border border-gray-200">
            {specifications.map((row) => (
              <div key={row.label} className="grid border-b border-gray-200 last:border-b-0 sm:grid-cols-[0.4fr_1fr]">
                <dt className="bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {row.label}
                </dt>
                <dd className="break-words px-3 py-2 text-sm text-gray-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {relatedGroups.map((group) => (
          <section key={group.type} className="mt-12">
            <h2 className="text-xl font-semibold">{group.title}</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {group.items.map((product) => (
                <ProductCard key={product.itemId} locale={locale} product={product} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
