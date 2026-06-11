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
    "lib/site-assets.ts",
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

test("metadata points og:image and twitter:image at the dynamic 1200x630 OG card", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass")
  const metadata = seo.buildShopMetadata({
    locale: "cs",
    seo: product.item.seo,
    fallbackTitle: "Fallback",
    fallbackDescription: "Fallback description",
  })

  assert.equal(metadata.twitter.card, "summary_large_image")
  const ogImage = metadata.openGraph.images[0]
  assert.match(ogImage.url, /\/api\/shop\/og\?/)
  assert.equal(ogImage.width, 1200)
  assert.equal(ogImage.height, 630)
  assert.ok(ogImage.alt)
  assert.equal(metadata.twitter.images[0], ogImage.url)
})

test("buildShopOgImageUrl encodes locale, title, price and image", () => {
  const url = new URL(
    seo.buildShopOgImageUrl({
      locale: "uk",
      title: "Захисне скло",
      price: 199,
      image: "https://pub-test.r2.dev/products/glass.png",
    }),
  )

  assert.equal(url.pathname, "/api/shop/og")
  assert.equal(url.searchParams.get("locale"), "uk")
  assert.equal(url.searchParams.get("title"), "Захисне скло")
  assert.equal(url.searchParams.get("price"), "199")
  assert.equal(url.searchParams.get("img"), "https://pub-test.r2.dev/products/glass.png")
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

test("ProductGroup JSON-LD carries productGroupID, variesBy and return policy", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass")
  const jsonLd = seo.buildProductJsonLd(product.item, product.selectedVariant, "cs")

  assert.equal(jsonLd.productGroupID, product.item.slug)
  assert.ok(Array.isArray(jsonLd.variesBy))
  assert.ok(jsonLd.variesBy.length >= 1)
  assert.equal(jsonLd.offers.hasMerchantReturnPolicy.merchantReturnDays, 14)
  assert.equal(jsonLd.offers.hasMerchantReturnPolicy.applicableCountry, "CZ")
  // The group description is duplicated into every variant Product.
  assert.equal(jsonLd.hasVariant[0].description, jsonLd.description)
})

test("variant JSON-LD urls use the locale's slugLocalized when present", () => {
  const product = catalog.getMockShopProduct("uk", "protective-glass")
  const jsonLd = seo.buildProductJsonLd(product.item, product.selectedVariant, "uk")
  const iphone11 = jsonLd.hasVariant.find((variant) => variant.sku === "GLASS-IP11")

  assert.ok(iphone11.url.endsWith("/zakhysne-sklo-iphone-11"))

  // Default store locale keeps the canonical slugOverride.
  const csJsonLd = seo.buildProductJsonLd(product.item, product.selectedVariant, "cs")
  const csIphone11 = csJsonLd.hasVariant.find((variant) => variant.sku === "GLASS-IP11")
  assert.ok(csIphone11.url.endsWith("/protective-glass-iphone-11"))
})

test("variant JSON-LD name has no trailing dash when the variant title is empty", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass")
  const item = {
    ...product.item,
    variants: product.item.variants.map((variant, index) =>
      index === 0 ? { ...variant, title: { cs: "" } } : variant,
    ),
  }
  const jsonLd = seo.buildProductJsonLd(item, item.variants[0], "cs")

  assert.equal(jsonLd.hasVariant[0].name, catalog.getLocalizedText(item.title, "cs"))
  assert.doesNotMatch(jsonLd.hasVariant[0].name, /\s-\s*$/)
})

test("offers include shippingDetails when the store delivery price is known", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass")
  const jsonLd = seo.buildProductJsonLd(product.item, product.selectedVariant, "cs", {
    shipping: { price: 79 },
  })

  assert.equal(jsonLd.offers.shippingDetails.shippingRate.value, 79)
  assert.equal(jsonLd.offers.shippingDetails.shippingRate.currency, "CZK")
  assert.equal(jsonLd.offers.shippingDetails.shippingDestination.addressCountry, "CZ")
  // Without shipping info the block is omitted rather than guessed.
  const bare = seo.buildProductJsonLd(product.item, product.selectedVariant, "cs")
  assert.equal(bare.offers.shippingDetails, undefined)
})

test("Organization and WebSite JSON-LD are linked via @id", () => {
  const organization = seo.buildShopOrganizationJsonLd()
  const website = seo.buildShopWebSiteJsonLd("cs")

  assert.equal(organization["@type"], "Organization")
  assert.match(organization["@id"], /#organization$/)
  assert.ok(organization.logo.url)
  assert.ok(organization.contactPoint.telephone)
  assert.equal(website["@type"], "WebSite")
  assert.equal(website.publisher["@id"], organization["@id"])
  assert.equal(website.name, "DeviceHelp Shop")
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
