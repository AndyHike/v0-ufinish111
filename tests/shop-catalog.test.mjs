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
  const files = ["lib/shop/types.ts", "lib/shop/mock-data.ts", "lib/shop/catalog.ts"]

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
    ["protective-glass", "usb-c-cable", "magsafe-charger", "iphone-battery"],
  )
})

test("finds category by slug and returns normalized products", () => {
  const category = catalog.getMockShopCategory("cs", "protection")

  assert.equal(category?.category.slug, "protection")
  assert.ok(category.products.length > 0)
  assert.equal(category.products[0].href, "/cs/product/protective-glass")
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
