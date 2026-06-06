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

test("shop home uses promo banners and avoids vertically stretched hero image frames", async () => {
  const source = await readSource("../components/shop/shop-home-page.tsx")

  assert.match(source, /promoBanners/)
  assert.match(source, /allCategories/)
  assert.match(source, /categoryTree/)
  assert.match(source, /ShopCategoryTreeNode/)
  assert.match(source, /aspect-\[16\/9\]/)
  assert.doesNotMatch(source, /min-h-\[320px\]/)
})

test("category page exposes hybrid catalog navigation and basic product filters", async () => {
  const source = await readSource("../components/shop/category-page.tsx")
  const routeSource = await readSource("../app/shop/[locale]/category/[slug]/page.tsx")

  assert.match(source, /categoryTree/)
  assert.match(source, /children/)
  assert.match(source, /priceBounds/)
  assert.match(source, /name="sort"/)
  assert.match(source, /name="minPrice"/)
  assert.match(source, /name="maxPrice"/)
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
