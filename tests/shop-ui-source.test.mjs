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
  assert.match(source, /aspect-\[16\/9\]/)
  assert.doesNotMatch(source, /min-h-\[320px\]/)
})

test("product page renders description, specifications, compatibility, and delivery sections", async () => {
  const source = await readSource("../components/shop/product-page.tsx")

  assert.match(source, /getProductSpecificationRows/)
  assert.match(source, /specifications/)
  assert.match(source, /compatibility/)
  assert.match(source, /delivery/)
})
