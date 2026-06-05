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

async function importCompiledShopModules() {
  const tempRoot = await mkdtemp(join(tmpdir(), "devicehelp-shop-seo-"))
  const files = [
    "lib/site-config.ts",
    "lib/og-locale.ts",
    "lib/shop/types.ts",
    "lib/shop/mock-data.ts",
    "lib/shop/catalog.ts",
    "lib/shop/seo.ts",
    "lib/seo/sitemap-xml.ts",
    "lib/seo/shop-sitemap.ts",
  ]

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

    return {
      catalog: require(join(tempRoot, "lib/shop/catalog.js")),
      seo: require(join(tempRoot, "lib/shop/seo.js")),
      shopSitemap: require(join(tempRoot, "lib/seo/shop-sitemap.js")),
    }
  } finally {
    setTimeout(() => {
      rm(tempRoot, { recursive: true, force: true }).catch(() => {})
    }, 100)
  }
}

const { catalog, seo, shopSitemap } = await importCompiledShopModules()

test("builds metadata from localized SEO with canonical and alternates", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass")
  const metadata = seo.buildShopMetadata({
    locale: "cs",
    seo: product.item.seo,
    fallbackTitle: "Fallback",
    fallbackDescription: "Fallback description",
  })

  assert.equal(metadata.alternates.canonical, "https://shop.devicehelp.cz/cs/product/protective-glass")
  assert.equal(metadata.alternates.languages.cs, "https://shop.devicehelp.cz/cs/product/protective-glass")
  assert.equal(metadata.alternates.languages.uk, "https://shop.devicehelp.cz/uk/product/protective-glass")
  assert.match(metadata.title, /sklo|glass/i)
  assert.equal(metadata.openGraph.siteName, "DeviceHelp Shop")
})

test("builds ProductGroup JSON-LD with variants and offers", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass", "protective-glass-iphone-11")
  const jsonLd = seo.buildProductJsonLd(product.item, product.selectedVariant, "cs")

  assert.equal(jsonLd["@context"], "https://schema.org")
  assert.equal(jsonLd["@type"], "ProductGroup")
  assert.ok(Array.isArray(jsonLd.hasVariant))
  assert.ok(jsonLd.hasVariant.length >= 2)
  assert.equal(jsonLd.hasVariant[1].offers.price, "199")
  assert.equal(jsonLd.hasVariant[1].offers.availability, "https://schema.org/InStock")
})

test("builds breadcrumb JSON-LD", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass")
  const jsonLd = seo.buildBreadcrumbJsonLd("cs", [
    { name: "Shop", url: "https://shop.devicehelp.cz/cs" },
    { name: "Ochrana telefonu", url: "https://shop.devicehelp.cz/cs/category/protection" },
    { name: "Premiove ochranne sklo", url: product.item.seo.locales.cs.canonicalUrl },
  ])

  assert.equal(jsonLd["@type"], "BreadcrumbList")
  assert.equal(jsonLd.itemListElement.length, 3)
  assert.equal(jsonLd.itemListElement[2].position, 3)
})

test("builds sitemap records from indexable SEO records", () => {
  const home = catalog.getMockShopHomeData("cs")
  const product = catalog.getMockShopProduct("cs", "protective-glass")
  const records = seo.buildShopSitemapRecords([home.categories[0].seo, product.item.seo])

  assert.equal(records.length, 2)
  assert.equal(records[0].url, "https://shop.devicehelp.cz/cs/category/protection")
  assert.equal(records[1].alternates.uk, "https://shop.devicehelp.cz/uk/product/protective-glass")
  assert.equal(records[1].changeFrequency, "weekly")
})

test("shop SEO mock data is based on configurable shopSiteUrl", async () => {
  const source = await readFile(new URL("../lib/shop/mock-data.ts", import.meta.url), "utf8")

  assert.match(source, /shopSiteUrl/)
  assert.doesNotMatch(source, /const SHOP_BASE_URL = "https:\/\/shop\.devicehelp\.cz"/)
})

test("robots and sitemap route handlers branch for shop hosts", async () => {
  const robotsSource = await readFile(new URL("../app/robots.txt/route.ts", import.meta.url), "utf8")
  const sitemapSource = await readFile(new URL("../app/sitemap.xml/route.ts", import.meta.url), "utf8")

  assert.match(robotsSource, /isShopHost/)
  assert.match(robotsSource, /shopSiteUrl/)
  assert.match(sitemapSource, /isShopHost/)
  assert.match(sitemapSource, /getShopSitemapEntries/)
})

test("shop sitemap exposes only shop catalog URLs", () => {
  const records = shopSitemap.getShopSitemapEntries()
  const urls = records.map((record) => record.url)

  assert.ok(urls.includes("https://shop.devicehelp.cz/cs"))
  assert.ok(urls.includes("https://shop.devicehelp.cz/cs/category/protection"))
  assert.ok(urls.includes("https://shop.devicehelp.cz/cs/product/protective-glass"))
  assert.equal(urls.some((url) => url.includes("/services/")), false)
  assert.equal(urls.some((url) => url.includes("/brands/")), false)
  assert.equal(urls.some((url) => url.includes("/cart")), false)
  assert.equal(urls.some((url) => url.includes("/checkout")), false)
})
