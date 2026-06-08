import test from "node:test"
import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const require = createRequire(import.meta.url)
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

async function importCompiledShopModule(entryFile) {
  const tempRoot = await mkdtemp(join(tmpdir(), "devicehelp-shop-catalog-"))
  const files = ["lib/site-config.ts", "lib/shop/types.ts", "lib/shop/mock-data.ts", "lib/shop/catalog.ts"]

  try {
    for (const file of files) {
      const sourcePath = join(repoRoot, file)
      const source = await readFile(sourcePath, "utf8")
      const { outputText } = ts.transpileModule(source, {
        compilerOptions: {
          esModuleInterop: true,
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      })
      const outputPath = join(tempRoot, file.replace(/\.ts$/, ".js"))
      await mkdir(dirname(outputPath), { recursive: true })
      await writeFile(outputPath, outputText)
    }

    return require(join(tempRoot, entryFile.replace(/\.ts$/, ".js")))
  } finally {
    setTimeout(() => {
      rm(tempRoot, { recursive: true, force: true }).catch(() => {})
    }, 100)
  }
}

const catalog = await importCompiledShopModule("lib/shop/catalog.ts")

test("returns shop homepage data for Czech", () => {
  const home = catalog.getMockShopHomeData("cs")

  assert.ok(home.categories.length >= 4)
  assert.ok(home.featuredProducts.length >= 4)
  assert.equal(home.hero.locale, "cs")
  assert.deepEqual(
    home.featuredProducts.map((product) => product.slug),
    ["protective-glass", "model-test-protective-glass", "usb-c-cable", "magsafe-charger", "iphone-battery"],
  )
})

test("finds category by slug and returns normalized products", () => {
  const category = catalog.getMockShopCategory("cs", "protection")

  assert.equal(category?.category.slug, "protection")
  assert.ok(category.products.length > 0)
  assert.equal(category.products[0].href, "/cs/product/protective-glass")
})

test("builds an active nested category tree for catalog navigation", () => {
  const tree = catalog.buildShopCategoryTree()
  const protection = tree.find((node) => node.category.slug === "protection")
  const glass = protection?.children.find((node) => node.category.slug === "display-protection")

  assert.ok(protection)
  assert.ok(protection.children.length >= 2)
  assert.ok(glass)
  assert.ok(glass.children.some((node) => node.category.slug === "iphone-protection"))
  assert.ok(tree.every((node) => node.category.parentId === null))
})

test("category pages include descendants and child category metadata", () => {
  const category = catalog.getMockShopCategory("cs", "protection")

  assert.ok(category)
  assert.ok(category.children.some((child) => child.slug === "display-protection"))
  assert.ok(category.categoryTree.some((node) => node.category.slug === "protection"))
  assert.ok(category.products.some((product) => product.slug === "model-test-protective-glass"))
  assert.equal(category.priceBounds.min, 249)
  assert.equal(category.priceBounds.max, 299)
})

test("sorts category products by effective price", () => {
  const category = catalog.getMockShopCategory("cs", "protection", { sort: "price-desc" })
  const prices = category.products.map((product) => product.salePrice ?? product.price)

  assert.deepEqual(prices, [...prices].sort((a, b) => b - a))
  assert.equal(category.activeFilters.sort, "price-desc")
})

test("filters category products by price range", () => {
  const category = catalog.getMockShopCategory("cs", "protection", { minPrice: 280, maxPrice: 310 })
  const prices = category.products.map((product) => product.salePrice ?? product.price)

  assert.ok(category.products.length > 0)
  assert.ok(prices.every((price) => price >= 280 && price <= 310))
  assert.equal(category.activeFilters.minPrice, 280)
  assert.equal(category.activeFilters.maxPrice, 310)
})

test("selects default variant when no variant slug is supplied", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass")

  assert.equal(product?.selectedVariant.isDefault, true)
})

test("selects variant by slug override", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass", "protective-glass-iphone-11")

  assert.equal(product?.selectedVariant.slugOverride, "protective-glass-iphone-11")
  assert.equal(product?.selectedVariant.salePrice, 199)
})

test("returns null for invalid variant slug overrides", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass", "not-a-real-variant")

  assert.equal(product, null)
})

test("keeps planned default variant ids and stock counts", () => {
  const cable = catalog.getMockShopProduct("cs", "usb-c-cable")
  const magsafe = catalog.getMockShopProduct("cs", "magsafe-charger")
  const battery = catalog.getMockShopProduct("cs", "iphone-battery")

  assert.equal(cable?.selectedVariant.id, "variant-usb-c-cable-default")
  assert.equal(cable?.selectedVariant.price, 299)
  assert.equal(cable?.selectedVariant.availability.availableStock, 12)
  assert.equal(magsafe?.selectedVariant.id, "variant-magsafe-charger-default")
  assert.equal(magsafe?.selectedVariant.price, 890)
  assert.equal(magsafe?.selectedVariant.salePrice, 790)
  assert.equal(magsafe?.selectedVariant.availability.availableStock, 5)
  assert.equal(battery?.selectedVariant.id, "variant-iphone-battery-13")
  assert.equal(battery?.selectedVariant.price, 1190)
  assert.equal(battery?.selectedVariant.availability.availableStock, 2)
})

test("limits quantity by tracked stock", () => {
  assert.equal(catalog.getMaxPurchasableQuantity({ trackInventory: true, availability: { availableStock: 3 } }), 3)
  assert.equal(catalog.getMaxPurchasableQuantity({ trackInventory: true, availability: { availableStock: 0 } }), 0)
  assert.equal(catalog.getMaxPurchasableQuantity({ trackInventory: false, availability: { availableStock: null } }), 99)
})

test("marks out-of-stock variants as not purchasable", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass", "protective-glass-iphone-12")

  assert.equal(catalog.getMaxPurchasableQuantity(product.selectedVariant), 0)
  assert.equal(catalog.isVariantPurchasable(product.selectedVariant), false)
})

test("formats CZK prices", () => {
  assert.match(catalog.formatShopPrice(249, "cs"), /^249\s*Kč$/u)
})

test("returns localized fallback text", () => {
  assert.equal(catalog.getLocalizedText({ en: "Fallback title" }, "uk"), "Fallback title")
})

test("builds product specification rows from variant facts and attributes", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass", "protective-glass-iphone-11")
  const rows = catalog.getProductSpecificationRows(product.item, product.selectedVariant, "cs")
  const valuesByLabel = new Map(rows.map((row) => [row.label, row.value]))

  assert.equal(valuesByLabel.get("Znacka"), "DeviceHelp")
  assert.equal(valuesByLabel.get("Model"), "iPhone 11")
  assert.equal(valuesByLabel.get("SKU"), "GLASS-IP11")
  assert.equal(valuesByLabel.get("MPN"), "GLASS-IP11")
  assert.equal(valuesByLabel.get("Dostupnost"), "Skladem 3 ks")
})

test("uses searchable variant selector mode only for larger variant sets", () => {
  assert.equal(catalog.getVariantSelectorMode({ variantCount: 1 }), "chips")
  assert.equal(catalog.getVariantSelectorMode({ variantCount: 6 }), "chips")
  assert.equal(catalog.getVariantSelectorMode({ variantCount: 7 }), "search")
  assert.equal(catalog.getVariantSelectorMode({ variantCount: 20 }), "search")
})

test("exposes a large mock variant product for selector QA", () => {
  const product = catalog.getMockShopProduct("cs", "model-test-protective-glass")

  assert.equal(product?.item.slug, "model-test-protective-glass")
  assert.equal(product.item.variants.length, 24)
  assert.equal(catalog.getVariantSelectorMode({ variantCount: product.item.variants.length }), "search")
  assert.equal(product.selectedVariant.isDefault, true)
  assert.ok(product.item.variants.some((variant) => variant.availability.availableStock === 0))
  assert.ok(product.item.variants.some((variant) => variant.salePrice !== null))
})

test("forced-variant card renders one variant as a standalone single-variant card", () => {
  // ItemVariantCategory rows (PUBLIC_API_DOCS §2.4): pass the matched variant id.
  const product = catalog.getMockShopProduct("cs", "protective-glass")
  const item = product.item
  const saleVariant = item.variants.find((variant) => variant.id === "variant-glass-iphone-11")
  assert.ok(saleVariant && saleVariant.salePrice !== null)

  const card = catalog.toProductCard(item, "cs", saleVariant.id)

  assert.equal(card.variantId, "variant-glass-iphone-11")
  assert.equal(card.priceFrom, false) // never "from X"
  assert.equal(card.displayPrice, saleVariant.salePrice) // 199
  assert.equal(card.compareAtPrice, saleVariant.price) // 229
  assert.equal(card.discountPercent, 13)
  assert.equal(card.title, "Premiove ochranne sklo iPhone 11") // item + variant title joined
  assert.equal(card.href, "/cs/product/protective-glass/protective-glass-iphone-11")
  assert.equal(card.isPurchasable, true)
})

test("forced-variant card reflects the matched variant stock, not the item default", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass")
  const outOfStock = product.item.variants.find((variant) => variant.id === "variant-glass-iphone-12")
  assert.ok(outOfStock && outOfStock.availability.availableStock === 0)

  const card = catalog.toProductCard(product.item, "cs", outOfStock.id)
  assert.equal(card.isPurchasable, false)

  // Default (no forced id) stays the multi-variant "from X" item card.
  const itemCard = catalog.toProductCard(product.item, "cs")
  assert.equal(itemCard.priceFrom, true)
  assert.equal(itemCard.href, "/cs/product/protective-glass")
})

test("getVariantProductTitle joins item and variant, avoiding duplication", () => {
  // Bare model variant title → join with the item title.
  assert.equal(
    catalog.getVariantProductTitle({ title: { cs: "Ochranne sklo" } }, { title: { cs: "iPhone 11" } }, "cs"),
    "Ochranne sklo iPhone 11",
  )
  // Variant title already carries the item context → don't duplicate it.
  assert.equal(
    catalog.getVariantProductTitle({ title: { cs: "Ochranne sklo" } }, { title: { cs: "Ochranne sklo pro iPhone 11" } }, "cs"),
    "Ochranne sklo pro iPhone 11",
  )
  // Missing variant title → fall back to the item title.
  assert.equal(
    catalog.getVariantProductTitle({ title: { cs: "Ochranne sklo" } }, { title: { cs: "" } }, "cs"),
    "Ochranne sklo",
  )
})

test("getVariantRouteSlug prefers slugOverride, falls back to option slugs", () => {
  assert.equal(
    catalog.getVariantRouteSlug({ slugOverride: "glass-ip11", selectedOptions: [{ optionSlug: "iphone-11" }] }),
    "glass-ip11",
  )
  assert.equal(
    catalog.getVariantRouteSlug({ slugOverride: null, selectedOptions: [{ optionSlug: "iphone-11" }] }),
    "iphone-11",
  )
  assert.equal(
    catalog.getVariantRouteSlug({ slugOverride: null, selectedOptions: [{ optionSlug: "black" }, { optionSlug: "128gb" }] }),
    "black-128gb",
  )
  assert.equal(catalog.getVariantRouteSlug({ slugOverride: null, selectedOptions: [] }), null)
})

test("getMockShopProduct flags a variant-slug open as a variant view", () => {
  const itemView = catalog.getMockShopProduct("cs", "protective-glass")
  assert.equal(itemView.isVariantView, false)

  const variantView = catalog.getMockShopProduct("cs", "protective-glass", "protective-glass-iphone-11")
  assert.equal(variantView.isVariantView, true)
})

test("selectProductVariantByRoute matches a slug-less variant by its option slug", () => {
  // A category-bound variant with no slugOverride is still addressable via its
  // option slug, so its card opens the variant page (not the base product).
  const item = {
    variants: [
      { id: "v11", slugOverride: null, isDefault: true, selectedOptions: [{ optionSlug: "iphone-11" }] },
      { id: "v12", slugOverride: null, isDefault: false, selectedOptions: [{ optionSlug: "iphone-12" }] },
    ],
  }
  assert.equal(catalog.selectProductVariantByRoute(item, "iphone-12").id, "v12")
  assert.equal(catalog.selectProductVariantByRoute(item, "iphone-11").id, "v11")
  assert.equal(catalog.selectProductVariantByRoute(item, "not-a-model"), null)
})
