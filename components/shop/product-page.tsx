import Link from "next/link"

import { ProductCard } from "@/components/shop/product-card"
import { ProductGallery } from "@/components/shop/product-gallery"
import { ProductPurchasePanel } from "@/components/shop/product-purchase-panel"
import { StructuredData } from "@/components/shop/structured-data"
import { getAvailabilityLabel, getLocalizedText, getProductSpecificationRows } from "@/lib/shop/catalog"
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/shop/seo"
import { shopSiteUrl } from "@/lib/site-config"
import type { ShopItem, ShopLocale, ShopProductCardView, ShopVariant } from "@/lib/shop/types"

const PRODUCT_COPY = {
  cs: {
    shop: "Shop",
    details: "Popis produktu",
    specifications: "Charakteristiky",
    compatibility: "Kompatibilita a varianty",
    delivery: "Doprava a zaruka",
    deliveryItems: [
      ["Pripraveno na Packeta", "Checkout bude pocitat s vydejnimi misty a dorucenim po CR."],
      ["Overeno servisem", "Produkty vybirame podle realne kompatibility a servisnich zkusenosti."],
      ["Jasna dostupnost", "Sklad a prodej se budou ridit variantou, ne jen obecnym produktem."],
    ],
    related: "Souvisejici produkty",
  },
  uk: {
    shop: "Shop",
    details: "Опис товару",
    specifications: "Характеристики",
    compatibility: "Сумісність і варіанти",
    delivery: "Доставка і гарантія",
    deliveryItems: [
      ["Готово до Packeta", "Checkout буде враховувати точки видачі та доставку."],
      ["Перевірено сервісом", "Товари підбираються за реальною сумісністю й досвідом ремонту."],
      ["Чітка наявність", "Склад і продаж привʼязані до варіанту, а не лише до загального товару."],
    ],
    related: "Повʼязані товари",
  },
  en: {
    shop: "Shop",
    details: "Product description",
    specifications: "Specifications",
    compatibility: "Compatibility and variants",
    delivery: "Delivery and warranty",
    deliveryItems: [
      ["Packeta ready", "Checkout will support pickup points and delivery flows."],
      ["Service checked", "Products are selected around real compatibility and repair experience."],
      ["Clear availability", "Stock and sales stay tied to exact variants, not only the parent product."],
    ],
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

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
          <ProductGallery images={selectedVariant.images.length ? selectedVariant.images : item.images} title={title} />
          <div className="min-w-0">
            <h1 className="max-w-full break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-5xl">{title}</h1>
            <p className="mt-4 text-sm leading-7 text-gray-600">{getLocalizedText(item.description, locale)}</p>
            <div className="mt-8">
              <ProductPurchasePanel
                locale={locale}
                item={{ id: item.id, title: item.title, variants: item.variants }}
                selectedVariant={selectedVariant}
              />
            </div>
          </div>
        </div>

        <section className="mt-12 grid gap-8 border-t border-gray-200 pt-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.72fr)]">
          <div>
            <h2 className="text-xl font-semibold">{copy.details}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600">{getLocalizedText(item.content, locale)}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">{copy.specifications}</h2>
            <dl className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              {specifications.map((row) => (
                <div key={row.label} className="grid border-b border-gray-200 last:border-b-0 sm:grid-cols-[0.48fr_1fr]">
                  <dt className="bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {row.label}
                  </dt>
                  <dd className="break-words px-3 py-2 text-sm text-gray-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mt-12 grid gap-8 border-t border-gray-200 pt-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.72fr)]">
          <div>
            <h2 className="text-xl font-semibold">{copy.compatibility}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {item.variants.map((variant) => (
                <div key={variant.id} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-semibold text-gray-950">{getLocalizedText(variant.title, locale)}</p>
                  <p className="mt-1 text-xs text-gray-500">{getAvailabilityLabel(variant, locale)}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold">{copy.delivery}</h2>
            <div className="mt-4 grid gap-3">
              {copy.deliveryItems.map(([label, text]) => (
                <div key={label} className="rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-950">{label}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {relatedItems.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">{copy.related}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
