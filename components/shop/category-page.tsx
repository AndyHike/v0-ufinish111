import Link from "next/link"

import { ProductCard } from "@/components/shop/product-card"
import { StructuredData } from "@/components/shop/structured-data"
import { shopSiteUrl } from "@/lib/site-config"
import { formatShopPrice, getLocalizedText } from "@/lib/shop/catalog"
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "@/lib/shop/seo"
import type {
  ShopCategory,
  ShopCategoryFilters,
  ShopCategoryPriceBounds,
  ShopCategoryTreeNode,
  ShopLocale,
  ShopProductCardView,
} from "@/lib/shop/types"

const CATEGORY_COPY = {
  cs: {
    shop: "Shop",
    catalog: "Catalog",
    filters: "Filtry",
    filtersText: "Atributove filtry prijdou z katalogoveho API; zaklad ceny a razeni uz drzi URL.",
    empty: "V teto kategorii zatim nejsou produkty.",
    products: "Produkty",
    subcategories: "Podkategorie",
    price: "Cena",
    minPrice: "Od",
    maxPrice: "Do",
    sort: "Razeni",
    recommendedSort: "Doporucene",
    cheapest: "Nejlevnejsi",
    expensive: "Nejdrazsi",
    apply: "Pouzit",
    reset: "Reset",
    results: "polozek",
    attributes: "Rychle atributy",
  },
  uk: {
    shop: "Shop",
    catalog: "Каталог",
    filters: "Фільтри",
    filtersText: "Атрибутні фільтри прийдуть з catalog API; базова ціна й сортування вже тримають URL.",
    empty: "У цій категорії поки немає товарів.",
    products: "Товари",
    subcategories: "Підкатегорії",
    price: "Ціна",
    minPrice: "Від",
    maxPrice: "До",
    sort: "Сортування",
    recommendedSort: "Рекомендовані",
    cheapest: "Найдешевші",
    expensive: "Найдорожчі",
    apply: "Застосувати",
    reset: "Скинути",
    results: "позицій",
    attributes: "Швидкі атрибути",
  },
  en: {
    shop: "Shop",
    catalog: "Catalog",
    filters: "Filters",
    filtersText: "Attribute filters will come from the catalog API; price and sort already live in the URL.",
    empty: "There are no products in this category yet.",
    products: "Products",
    subcategories: "Subcategories",
    price: "Price",
    minPrice: "Min",
    maxPrice: "Max",
    sort: "Sort",
    recommendedSort: "Recommended",
    cheapest: "Cheapest",
    expensive: "Most expensive",
    apply: "Apply",
    reset: "Reset",
    results: "items",
    attributes: "Quick attributes",
  },
} as const

function categoryHref(locale: ShopLocale, category: ShopCategory) {
  return `/${locale}/category/${category.slug}`
}

function CategoryTree({
  locale,
  nodes,
  activeSlug,
  depth = 0,
}: {
  locale: ShopLocale
  nodes: ShopCategoryTreeNode[]
  activeSlug: string
  depth?: number
}) {
  return (
    <ul className={depth === 0 ? "space-y-1" : "mt-1 space-y-1 border-l border-gray-200 pl-3"}>
      {nodes.map((node) => {
        const isActive = node.category.slug === activeSlug

        return (
          <li key={node.category.id}>
            <Link
              href={categoryHref(locale, node.category)}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                isActive ? "bg-gray-950 font-semibold text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-950"
              }`}
            >
              <span className="min-w-0 truncate">{getLocalizedText(node.category.title, locale)}</span>
              {node.children.length > 0 ? (
                <span className={isActive ? "ml-2 text-xs text-gray-300" : "ml-2 text-xs text-gray-400"}>
                  {node.children.length}
                </span>
              ) : null}
            </Link>
            {node.children.length > 0 ? (
              <CategoryTree locale={locale} nodes={node.children} activeSlug={activeSlug} depth={depth + 1} />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export function CategoryPage({
  locale,
  category,
  children: childCategories,
  ancestors,
  categoryTree,
  priceBounds,
  activeFilters,
  products,
}: {
  locale: ShopLocale
  category: ShopCategory
  children: ShopCategory[]
  ancestors: ShopCategory[]
  categoryTree: ShopCategoryTreeNode[]
  priceBounds: ShopCategoryPriceBounds
  activeFilters: ShopCategoryFilters
  products: ShopProductCardView[]
}) {
  const copy = CATEGORY_COPY[locale]
  const title = getLocalizedText(category.title, locale)
  const description = getLocalizedText(category.description, locale)
  const canonicalUrl = category.seo.locales[locale]?.canonicalUrl ?? category.seo.canonicalUrl
  const collectionJsonLd = buildCollectionPageJsonLd({ name: title, description, url: canonicalUrl })
  const breadcrumbItems = [
    { name: copy.shop, url: `${shopSiteUrl}/${locale}` },
    ...ancestors.map((ancestor) => ({
      name: getLocalizedText(ancestor.title, locale),
      url: ancestor.seo.locales[locale]?.canonicalUrl ?? ancestor.seo.canonicalUrl,
    })),
    { name: title, url: canonicalUrl },
  ]
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, breadcrumbItems)
  const priceSummary =
    priceBounds.min !== null && priceBounds.max !== null
      ? `${formatShopPrice(priceBounds.min, locale)} - ${formatShopPrice(priceBounds.max, locale)}`
      : null

  return (
    <div className="bg-white text-gray-950">
      <StructuredData id="shop-category-jsonld" data={collectionJsonLd} />
      <StructuredData id="shop-category-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <div className="container px-4 py-8 md:px-6">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          {breadcrumbItems.map((item, index) => (
            <span key={item.url} className="inline-flex items-center gap-2">
              {index > 0 ? <span>/</span> : null}
              {index === breadcrumbItems.length - 1 ? (
                <span className="text-gray-700">{item.name}</span>
              ) : (
                <Link href={index === 0 ? `/${locale}` : item.url.replace(shopSiteUrl, "")} className="hover:text-gray-900">
                  {item.name}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
            <section className="rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">{copy.catalog}</h2>
              <div className="mt-4">
                <CategoryTree locale={locale} nodes={categoryTree} activeSlug={category.slug} />
              </div>
            </section>

            <form method="get" className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">{copy.filters}</h2>
                {priceSummary ? <span className="text-xs font-medium text-gray-500">{priceSummary}</span> : null}
              </div>

              <label htmlFor="category-sort" className="mt-5 block text-sm font-semibold text-gray-900">
                {copy.sort}
              </label>
              <select
                id="category-sort"
                name="sort"
                defaultValue={activeFilters.sort}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-950"
              >
                <option value="recommended">{copy.recommendedSort}</option>
                <option value="price-asc">{copy.cheapest}</option>
                <option value="price-desc">{copy.expensive}</option>
              </select>

              <div className="mt-5">
                <p className="text-sm font-semibold text-gray-900">{copy.price}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    name="minPrice"
                    inputMode="numeric"
                    defaultValue={activeFilters.minPrice ?? ""}
                    placeholder={priceBounds.min !== null ? `${copy.minPrice} ${priceBounds.min}` : copy.minPrice}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                  />
                  <input
                    name="maxPrice"
                    inputMode="numeric"
                    defaultValue={activeFilters.maxPrice ?? ""}
                    placeholder={priceBounds.max !== null ? `${copy.maxPrice} ${priceBounds.max}` : copy.maxPrice}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button type="submit" className="flex-1 rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white">
                  {copy.apply}
                </button>
                <Link
                  href={categoryHref(locale, category)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  {copy.reset}
                </Link>
              </div>

              <div className="mt-5 border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-900">{copy.attributes}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["iPhone", "Samsung", "USB-C"].map((label) => (
                    <span key={label} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      {label}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">{copy.filtersText}</p>
              </div>
            </form>
          </aside>

          <main className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-500">{copy.products}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">{description}</p>

            {childCategories.length > 0 ? (
              <section className="mt-8">
                <h2 className="text-lg font-semibold tracking-tight">{copy.subcategories}</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {childCategories.map((childCategory) => (
                    <Link
                      key={childCategory.id}
                      href={categoryHref(locale, childCategory)}
                      className="rounded-lg border border-gray-200 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <h3 className="font-semibold">{getLocalizedText(childCategory.title, locale)}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                        {getLocalizedText(childCategory.description, locale)}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-gray-100 py-4">
              <p className="text-sm font-medium text-gray-600">
                {products.length} {copy.results}
              </p>
              <form method="get" className="flex items-center gap-2">
                {activeFilters.minPrice !== null ? <input type="hidden" name="minPrice" value={activeFilters.minPrice} /> : null}
                {activeFilters.maxPrice !== null ? <input type="hidden" name="maxPrice" value={activeFilters.maxPrice} /> : null}
                <label htmlFor="category-toolbar-sort" className="sr-only">
                  {copy.sort}
                </label>
                <select
                  id="category-toolbar-sort"
                  name="sort"
                  defaultValue={activeFilters.sort}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-950"
                >
                  <option value="recommended">{copy.recommendedSort}</option>
                  <option value="price-asc">{copy.cheapest}</option>
                  <option value="price-desc">{copy.expensive}</option>
                </select>
                <button type="submit" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700">
                  {copy.apply}
                </button>
              </form>
            </div>

            {products.length > 0 ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.itemId} locale={locale} product={product} />
                ))}
              </div>
            ) : (
              <p className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">{copy.empty}</p>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
