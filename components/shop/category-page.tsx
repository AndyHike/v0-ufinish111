import Image from "next/image"
import Link from "next/link"

import { ProductCard } from "@/components/shop/product-card"
import { ShopFilterDrawer } from "@/components/shop/shop-filter-drawer"
import { StructuredData } from "@/components/shop/structured-data"
import { shopSiteUrl } from "@/lib/site-config"
import { formatShopPrice, getLocalizedText } from "@/lib/shop/catalog"
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "@/lib/shop/seo"
import type {
  ShopCategory,
  ShopCategoryFilters,
  ShopCategoryPriceBounds,
  ShopFilterAttribute,
  ShopLocale,
  ShopProductCardView,
} from "@/lib/shop/types"

const CATEGORY_COPY = {
  cs: {
    shop: "Shop",
    filters: "Filtry",
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
    reset: "Zrusit filtry",
    results: "polozek",
    showMore: "Zobrazit vice",
    showLess: "Zobrazit mene",
    close: "Zavrit",
  },
  uk: {
    shop: "Shop",
    filters: "Фільтри",
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
    reset: "Скинути фільтри",
    results: "позицій",
    showMore: "Показати ще",
    showLess: "Згорнути",
    close: "Закрити",
  },
  en: {
    shop: "Shop",
    filters: "Filters",
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
    reset: "Clear filters",
    results: "items",
    showMore: "Show more",
    showLess: "Show less",
    close: "Close",
  },
} as const

const VISIBLE_OPTIONS = 8

function categoryHref(locale: ShopLocale, category: ShopCategory) {
  return `/${locale}/category/${category.slug}`
}

function ActiveFilterHiddenInputs({ activeFilters }: { activeFilters: ShopCategoryFilters }) {
  return (
    <>
      {activeFilters.minPrice !== null ? <input type="hidden" name="minPrice" value={activeFilters.minPrice} /> : null}
      {activeFilters.maxPrice !== null ? <input type="hidden" name="maxPrice" value={activeFilters.maxPrice} /> : null}
      {Object.entries(activeFilters.attributes).flatMap(([attributeSlug, values]) =>
        values.map((value) => (
          <input key={`${attributeSlug}-${value}`} type="hidden" name={`attr_${attributeSlug}`} value={value} />
        )),
      )}
    </>
  )
}

function FilterAttributeGroup({
  attribute,
  selected,
  showMoreLabel,
  showLessLabel,
}: {
  attribute: ShopFilterAttribute
  selected: string[]
  showMoreLabel: string
  showLessLabel: string
}) {
  // BOOLEAN facets carry no options — render a single on/off toggle that submits
  // `attr_<slug>=true` (parsed and matched like any other attribute value).
  if (attribute.type === "BOOLEAN") {
    return (
      <fieldset className="border-t border-gray-100 pt-4">
        <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 text-sm transition hover:bg-gray-50">
          <input
            type="checkbox"
            name={`attr_${attribute.slug}`}
            value="true"
            defaultChecked={selected.includes("true")}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="font-medium text-gray-900">{attribute.name}</span>
        </label>
      </fieldset>
    )
  }

  const visibleOptions = attribute.options.slice(0, VISIBLE_OPTIONS)
  const hiddenOptions = attribute.options.slice(VISIBLE_OPTIONS)
  const toggleId = `filter-more-${attribute.slug}`

  const renderOption = (option: ShopFilterAttribute["options"][number]) => (
    <label
      key={option.id}
      className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1.5 py-1 text-sm transition hover:bg-gray-50"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <input
          type="checkbox"
          name={`attr_${attribute.slug}`}
          value={option.slug}
          defaultChecked={selected.includes(option.slug)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className="truncate text-gray-700">{option.value}</span>
      </span>
      <span className="shrink-0 text-xs tabular-nums text-gray-400">{option.count}</span>
    </label>
  )

  return (
    <fieldset className="border-t border-gray-100 pt-4">
      <legend className="text-sm font-semibold text-gray-900">{attribute.name}</legend>
      <div className="mt-2 space-y-0.5">
        {visibleOptions.map(renderOption)}

        {hiddenOptions.length > 0 ? (
          <>
            <input id={toggleId} type="checkbox" className="peer sr-only" />
            <div className="hidden space-y-0.5 peer-checked:block">{hiddenOptions.map(renderOption)}</div>
            <label
              htmlFor={toggleId}
              className="mt-1 inline-flex cursor-pointer items-center px-1.5 text-sm font-medium text-primary hover:underline peer-checked:hidden"
            >
              {showMoreLabel} ({hiddenOptions.length})
            </label>
            <label
              htmlFor={toggleId}
              className="mt-1 hidden cursor-pointer items-center px-1.5 text-sm font-medium text-primary hover:underline peer-checked:inline-flex"
            >
              {showLessLabel}
            </label>
          </>
        ) : null}
      </div>
    </fieldset>
  )
}

export function CategoryPage({
  locale,
  category,
  children: childCategories,
  ancestors,
  priceBounds,
  filterAttributes,
  activeFilters,
  products,
}: {
  locale: ShopLocale
  category: ShopCategory
  children: ShopCategory[]
  ancestors: ShopCategory[]
  priceBounds: ShopCategoryPriceBounds
  filterAttributes: ShopFilterAttribute[]
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
      ? `${formatShopPrice(priceBounds.min, locale)} – ${formatShopPrice(priceBounds.max, locale)}`
      : null

  const selectedAttributeCount = Object.values(activeFilters.attributes).reduce((total, values) => total + values.length, 0)
  const priceFilterCount = (activeFilters.minPrice !== null ? 1 : 0) + (activeFilters.maxPrice !== null ? 1 : 0)
  const activeFilterCount = selectedAttributeCount + priceFilterCount
  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className="bg-white text-gray-950">
      <StructuredData id="shop-category-jsonld" data={collectionJsonLd} />
      <StructuredData id="shop-category-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <div className="container px-4 py-8 md:px-6">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          {breadcrumbItems.map((item, index) => (
            <span key={item.url} className="inline-flex items-center gap-2">
              {index > 0 ? <span className="text-gray-300">/</span> : null}
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

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-500">{copy.products}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">{description}</p>

          {childCategories.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {childCategories.map((childCategory) => (
                <Link
                  key={childCategory.id}
                  href={categoryHref(locale, childCategory)}
                  className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-1.5 pr-4 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  {childCategory.imageUrl ? (
                    <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gray-100">
                      <Image src={childCategory.imageUrl} alt="" fill sizes="28px" className="object-cover" />
                    </span>
                  ) : null}
                  <span className="truncate">{getLocalizedText(childCategory.title, locale)}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <ShopFilterDrawer triggerLabel={copy.filters} closeLabel={copy.close} activeCount={activeFilterCount}>
            <form method="get" className="lg:rounded-xl lg:border lg:border-gray-200">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-950">{copy.filters}</h2>
                {hasActiveFilters ? (
                  <Link href={categoryHref(locale, category)} className="text-xs font-medium text-gray-500 hover:text-gray-900">
                    {copy.reset}
                  </Link>
                ) : null}
              </div>

              <div className="space-y-4 p-4">
                <div>
                  <label htmlFor="category-sort" className="block text-sm font-semibold text-gray-900">
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
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{copy.price}</p>
                    {priceSummary ? <span className="text-xs font-medium text-gray-400">{priceSummary}</span> : null}
                  </div>
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

                {filterAttributes.map((attribute) => (
                  <FilterAttributeGroup
                    key={attribute.id}
                    attribute={attribute}
                    selected={activeFilters.attributes[attribute.slug] ?? []}
                    showMoreLabel={copy.showMore}
                    showLessLabel={copy.showLess}
                  />
                ))}

                <button
                  type="submit"
                  className="w-full rounded-md bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  {copy.apply}
                </button>
              </div>
            </form>
          </ShopFilterDrawer>

          <main className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <p className="text-sm font-medium text-gray-600">
                {products.length} {copy.results}
              </p>
              <form method="get" className="flex items-center gap-2">
                <ActiveFilterHiddenInputs activeFilters={activeFilters} />
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
                <button type="submit" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  {copy.apply}
                </button>
              </form>
            </div>

            {products.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-3">
                {products.map((product) => (
                  // Key by item+variant: one item can yield both an item row and
                  // standalone variant rows in the same listing (§2.4).
                  <ProductCard key={`${product.itemId}:${product.variantId}`} locale={locale} product={product} />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">{copy.empty}</p>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
