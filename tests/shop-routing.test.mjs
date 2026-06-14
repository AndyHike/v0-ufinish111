import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import ts from "typescript"

const source = await readFile(new URL("../lib/shop-routing.ts", import.meta.url), "utf8")
const middlewareSource = await readFile(new URL("../middleware.ts", import.meta.url), "utf8")
const siteConfigSource = await readFile(new URL("../lib/site-config.ts", import.meta.url), "utf8")
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"))

const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
})
const { outputText: siteConfigOutputText } = ts.transpileModule(siteConfigSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
})

const {
  DEFAULT_SHOP_LOCALE,
  getShopRedirectTarget,
  getShopRewritePath,
  getDefaultLocalizedShopPath,
  isAllowedShopPath,
  isShopHost,
  stripHostPort,
} = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(outputText)}`)

const previousShopSiteUrl = process.env.NEXT_PUBLIC_SHOP_SITE_URL
delete process.env.NEXT_PUBLIC_SHOP_SITE_URL
const { shopSiteUrl } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(siteConfigOutputText)}`)
if (previousShopSiteUrl === undefined) {
  delete process.env.NEXT_PUBLIC_SHOP_SITE_URL
} else {
  process.env.NEXT_PUBLIC_SHOP_SITE_URL = previousShopSiteUrl
}

test("uses Czech as the default shop locale", () => {
  assert.equal(DEFAULT_SHOP_LOCALE, "cs")
})

test("strips ports and lowercases hosts", () => {
  assert.equal(stripHostPort("Shop.DeviceHelp.cz:3000"), "shop.devicehelp.cz")
  assert.equal(stripHostPort("devicehelp.cz"), "devicehelp.cz")
})

test("detects shop hosts", () => {
  assert.equal(isShopHost("shop.devicehelp.cz"), true)
  assert.equal(isShopHost("shop.devicehelp.cz:3000"), true)
  assert.equal(isShopHost("shop.localhost:3000"), true)
  assert.equal(isShopHost("shop.preview-domain.test"), true)
  assert.equal(isShopHost("devicehelp.cz"), false)
  assert.equal(isShopHost("b2b.devicehelp.cz"), false)
  assert.equal(isShopHost("notshop.devicehelp.cz"), false)
})

test("allows localized shop catalog paths", () => {
  assert.equal(isAllowedShopPath("/"), true)
  assert.equal(isAllowedShopPath("/cs"), true)
  assert.equal(isAllowedShopPath("/uk"), true)
  assert.equal(isAllowedShopPath("/en"), true)
  assert.equal(isAllowedShopPath("/uk/category/accessories"), true)
  assert.equal(isAllowedShopPath("/en/product/protective-glass"), true)
  assert.equal(isAllowedShopPath("/cs/product/protective-glass/protective-glass-iphone-11"), true)
  assert.equal(isAllowedShopPath("/cs/cart"), true)
  assert.equal(isAllowedShopPath("/cs/checkout"), true)
  assert.equal(isAllowedShopPath("/cs/checkout/success"), true)
  assert.equal(isAllowedShopPath("/cs/legal/reklamacni-rad"), true)
  assert.equal(isAllowedShopPath("/uk/legal/privacy-policy"), true)
})

test("allows locale-less catalog paths so they canonicalize on the shop host", () => {
  assert.equal(isAllowedShopPath("/category/skla"), true)
  assert.equal(isAllowedShopPath("/product/protective-glass"), true)
  assert.equal(isAllowedShopPath("/product/protective-glass/protective-glass-iphone-11"), true)
  assert.equal(isAllowedShopPath("/cart"), true)
  assert.equal(isAllowedShopPath("/checkout"), true)
})

test("rejects non-shop paths on shop host", () => {
  assert.equal(isAllowedShopPath("/de"), false)
  assert.equal(isAllowedShopPath("/cs/brands/apple"), false)
  assert.equal(isAllowedShopPath("/cs/services/screen-replacement"), false)
  assert.equal(isAllowedShopPath("/cs/admin"), false)
  assert.equal(isAllowedShopPath("/api/search"), false)
  assert.equal(isAllowedShopPath("/cs/product/protective-glass/iphone-11/extra"), false)
})

test("rewrites localized shop paths to internal app/shop routes", () => {
  assert.equal(getShopRewritePath("shop.devicehelp.cz", "/cs"), "/shop/cs")
  assert.equal(getShopRewritePath("shop.devicehelp.cz", "/uk/category/accessories"), "/shop/uk/category/accessories")
  assert.equal(getShopRewritePath("shop.devicehelp.cz", "/en/product/protective-glass"), "/shop/en/product/protective-glass")
  assert.equal(
    getShopRewritePath("shop.localhost:3000", "/en/product/protective-glass/protective-glass-iphone-11"),
    "/shop/en/product/protective-glass/protective-glass-iphone-11",
  )
  assert.equal(getShopRewritePath("shop.devicehelp.cz", "/cs/legal/reklamacni-rad"), "/shop/cs/legal/reklamacni-rad")
})

test("does not rewrite main-domain, unlocalized root, or disallowed shop paths", () => {
  assert.equal(getShopRewritePath("devicehelp.cz", "/cs"), null)
  assert.equal(getShopRewritePath("shop.devicehelp.cz", "/"), null)
  assert.equal(getShopRewritePath("shop.devicehelp.cz", "/cart"), null)
  assert.equal(getShopRewritePath("shop.devicehelp.cz", "/cs/brands/apple"), null)
})

test("redirects disallowed shop paths to the main domain with query strings", () => {
  const target = getShopRedirectTarget({
    host: "shop.devicehelp.cz",
    pathname: "/cs/brands/apple",
    search: "?from=shop",
    mainBaseUrl: "https://devicehelp.cz",
  })

  assert.equal(target?.toString(), "https://devicehelp.cz/cs/brands/apple?from=shop")
})

test("localizes unlocalized main-domain fallback paths", () => {
  assert.equal(getDefaultLocalizedShopPath("/brands/apple"), "/cs/brands/apple")
  assert.equal(getDefaultLocalizedShopPath("/api/search"), "/api/search")
})

test("redirects shop-host API paths to the main API path", () => {
  const target = getShopRedirectTarget({
    host: "shop.devicehelp.cz",
    pathname: "/api/search",
    search: "?q=glass",
    mainBaseUrl: "https://devicehelp.cz",
  })

  assert.equal(target?.toString(), "https://devicehelp.cz/api/search?q=glass")
})

test("locale-less catalog deep links do not escape to the main domain", () => {
  // No main-domain redirect → the middleware's unified locale redirect picks
  // these up and 301s to /<locale><path> on the SAME shop host.
  for (const pathname of ["/category/skla", "/product/protective-glass", "/cart"]) {
    assert.equal(
      getShopRedirectTarget({
        host: "shop.devicehelp.cz",
        pathname,
        search: "",
        mainBaseUrl: "https://devicehelp.cz",
      }),
      null,
    )
  }
})

test("does not redirect allowed shop paths or main-domain paths", () => {
  assert.equal(
    getShopRedirectTarget({
      host: "shop.devicehelp.cz",
      pathname: "/cs/product/protective-glass",
      search: "",
      mainBaseUrl: "https://devicehelp.cz",
    }),
    null,
  )
  assert.equal(
    getShopRedirectTarget({
      host: "devicehelp.cz",
      pathname: "/cs/brands/apple",
      search: "",
      mainBaseUrl: "https://devicehelp.cz",
    }),
    null,
  )
})

test("uses shop subdomain as the default shop site URL", () => {
  assert.equal(shopSiteUrl, "https://shop.devicehelp.cz")
})

test("exposes focused shop routing test scripts", () => {
  assert.equal(packageJson.scripts["test:shop-routing"], "node --test tests/shop-routing.test.mjs")
  assert.equal(packageJson.scripts["test:shop"], "node --test tests/shop-*.test.mjs")
})

test("checks shop routing after B2B routing and before locale normalization", () => {
  const staticSkipIndex = middlewareSource.indexOf("Skip middleware for static files")
  const b2bRedirectIndex = middlewareSource.indexOf("const b2bRedirectTarget")
  const b2bRewriteIndex = middlewareSource.indexOf("const b2bRewritePath")
  const shopRedirectIndex = middlewareSource.indexOf("const shopRedirectTarget")
  const shopRewriteIndex = middlewareSource.indexOf("const shopRewritePath")
  const servicesMatchIndex = middlewareSource.indexOf("const servicesMatch")
  const localeRedirectIndex = middlewareSource.indexOf("UNIFIED REDIRECT LOGIC")

  assert.notEqual(staticSkipIndex, -1)
  assert.notEqual(b2bRedirectIndex, -1)
  assert.notEqual(b2bRewriteIndex, -1)
  assert.notEqual(shopRedirectIndex, -1)
  assert.notEqual(shopRewriteIndex, -1)
  assert.notEqual(servicesMatchIndex, -1)
  assert.notEqual(localeRedirectIndex, -1)
  assert.ok(staticSkipIndex < b2bRedirectIndex)
  assert.ok(b2bRedirectIndex < b2bRewriteIndex)
  assert.ok(b2bRewriteIndex < shopRedirectIndex)
  assert.ok(shopRedirectIndex < shopRewriteIndex)
  assert.ok(shopRewriteIndex < servicesMatchIndex)
  assert.ok(servicesMatchIndex < localeRedirectIndex)
  assert.match(middlewareSource, /NextResponse\.rewrite/)
})
