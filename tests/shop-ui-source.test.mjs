import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

async function readSource(path) {
  return readFile(new URL(path, import.meta.url), "utf8")
}

test("shop header opens an in-page cart drawer instead of linking the cart icon directly to cart page", async () => {
  const source = await readSource("../components/shop/shop-header.tsx")

  assert.match(source, /ShopCartDrawer/)
  assert.match(source, /openCart/)
  assert.doesNotMatch(source, /href=\{`\/\$\{locale\}\/cart`\}/)
})

test("shop home renders promo banners through the hero carousel with a static fallback", async () => {
  const source = await readSource("../components/shop/shop-home-page.tsx")
  const sidebarSource = await readSource("../components/shop/shop-category-sidebar.tsx")

  assert.match(source, /bannerSlides/)
  assert.match(source, /ShopHeroCarousel/)
  assert.match(source, /staticSlides/)
  assert.match(source, /ShopCategorySidebar/)
  assert.match(source, /categoryTree/)
  assert.doesNotMatch(source, /allCategories/)
  assert.doesNotMatch(source, /categoriesText/)
  assert.doesNotMatch(sidebarSource, /"use client"/)
  assert.doesNotMatch(sidebarSource, /useState/)
  assert.match(sidebarSource, /type="checkbox"/)
  assert.match(sidebarSource, /peer-checked/)
  assert.match(sidebarSource, /htmlFor/)
  assert.match(sidebarSource, /aria-label/)
})

test("category page exposes product filters without a category navigation tree", async () => {
  const source = await readSource("../components/shop/category-page.tsx")
  const routeSource = await readSource("../app/shop/[locale]/category/[slug]/page.tsx")

  assert.match(source, /children/)
  assert.match(source, /priceBounds/)
  assert.match(source, /name="sort"/)
  assert.match(source, /name="minPrice"/)
  assert.match(source, /name="maxPrice"/)
  assert.match(source, /attributes/)
  assert.doesNotMatch(source, /function CategoryTree/)
  assert.doesNotMatch(source, /categoryTree/)
  assert.doesNotMatch(routeSource, /categoryTree=\{data\.categoryTree\}/)
  assert.match(routeSource, /searchParams/)
  assert.match(routeSource, /normalizeShopCategoryFilters/)
})

test("product page keeps description and specifications without temporary compatibility or delivery sections", async () => {
  const source = await readSource("../components/shop/product-page.tsx")

  assert.match(source, /getProductSpecificationRows/)
  assert.match(source, /specifications/)
  assert.doesNotMatch(source, /compatibility/)
  assert.doesNotMatch(source, /delivery/)
})
