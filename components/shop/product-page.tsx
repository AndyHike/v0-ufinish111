import Link from "next/link"

import { ProductCard } from "@/components/shop/product-card"
import { ProductGallery } from "@/components/shop/product-gallery"
import { ProductPurchasePanel } from "@/components/shop/product-purchase-panel"
import { StructuredData } from "@/components/shop/structured-data"
import { getLocalizedText, getProductSpecificationRows } from "@/lib/shop/catalog"
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/shop/seo"
import { shopSiteUrl } from "@/lib/site-config"
import type { ShopItem, ShopLocale, ShopProductCardView, ShopVariant } from "@/lib/shop/types"

const PRODUCT_COPY = {
  cs: {
    shop: "Shop",
    details: "Popis produktu",
    specifications: "Charakteristiky",
    related: "Souvisejici produkty",
  },
  uk: {
    shop: "Shop",
    details: "Опис товару",
    specifications: "Характеристики",
    related: "Повʼязані товари",
  },
  en: {
    shop: "Shop",
    details: "Product description",
    specifications: "Specifications",
    related: "Related products",
  },
} as const

export function ProductPage({
  locale,
  item,
  selectedVariant,
  relatedItems,
}: {
  locale: ShopLocale
  item: ShopItem
  selectedVariant: ShopVariant
  relatedItems: ShopProductCardView[]
}) {
  const copy = PRODUCT_COPY[locale]
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
          <div className="flex min-w-0 flex-col">
            <h1 className="max-w-full break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">{title}</h1>
            <p className="mt-4 text-sm leading-7 text-gray-600">{getLocalizedText(item.description, locale)}</p>
            <div className="mt-8">
              <ProductPurchasePanel
                locale={locale}
                item={{ id: item.id, title: item.title, variants: item.variants, categories: item.categories }}
                selectedVariant={selectedVariant}
              />
            </div>
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

        {relatedItems.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">{copy.related}</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {relatedItems.map((product) => (
                <ProductCard key={product.itemId} locale={locale} product={product} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
