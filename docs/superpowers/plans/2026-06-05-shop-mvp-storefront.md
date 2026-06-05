# Shop MVP Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first mock-driven DeviceHelp shop storefront with shop subdomain routing, premium shop layout, homepage, category pages, product pages, variant/availability handling, SEO utilities, and a local cart shell.

**Architecture:** Add a separate shop module inside the existing Next.js app, following the established B2B host-rewrite pattern. Keep business data behind a shop data layer that starts with API-shaped mocks and later swaps to server-to-server API fetches. Keep most rendering server-side, with small client islands for cart and variant/quantity interaction.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, next-intl, Tailwind CSS, lucide-react, Node test runner.

---

## Scope Check

This plan implements the first visible storefront milestone from `docs/superpowers/specs/2026-06-05-shop-mvp-storefront-design.md`.

Included:

- Host-aware `shop.devicehelp.cz` routing.
- Shop layout, header, footer, and localized shell copy.
- API-shaped mock data and normalized view models.
- Shop homepage, category page, and product page.
- Variant selection, availability labels, and quantity constraints.
- Metadata, canonical handling, Breadcrumb JSON-LD, and Product/ProductGroup JSON-LD utilities.
- Local cart state and cart count/add-to-cart behavior.
- Tests for routing, data normalization, SEO helpers, and cart reducer.

Deferred outside this milestone:

- Real API client.
- Production checkout.
- Packeta widget integration.
- Stripe/payment integration.
- Merchant upload/sync automation.
- Backend/admin edits.

## File Structure

Create:

- `lib/shop-routing.ts` - host detection, allowed shop path checks, main-domain redirect logic, and internal rewrite path generation.
- `tests/shop-routing.test.mjs` - tests for shop host routing and middleware ordering.
- `lib/shop/types.ts` - public API-shaped types and normalized storefront view model types.
- `lib/shop/mock-data.ts` - Czech/Ukrainian/English mock categories, items, variants, SEO, and related products.
- `lib/shop/catalog.ts` - data access and normalization helpers used by pages and components.
- `tests/shop-catalog.test.mjs` - normalization, variant selection, stock state, and category lookup tests.
- `lib/shop/seo.ts` - metadata, canonical, sitemap records, Breadcrumb JSON-LD, and Product/ProductGroup JSON-LD builders.
- `tests/shop-seo.test.mjs` - SEO helper tests.
- `lib/shop/cart.ts` - local cart line snapshots and quantity guards.
- `tests/shop-cart.test.mjs` - cart reducer tests.
- `components/shop/shop-cart-provider.tsx` - client provider for local cart state.
- `components/shop/shop-header.tsx` - shop-specific header with categories, search affordance, language switcher, and cart count.
- `components/shop/shop-footer.tsx` - shop-specific footer with shop terms/delivery/returns links.
- `components/shop/shop-home-page.tsx` - server component for the shop homepage.
- `components/shop/category-page.tsx` - server component for category layout.
- `components/shop/product-card.tsx` - reusable product card.
- `components/shop/product-page.tsx` - product detail server wrapper.
- `components/shop/product-purchase-panel.tsx` - client component for variant/quantity/add-to-cart.
- `components/shop/product-gallery.tsx` - product image gallery.
- `components/shop/structured-data.tsx` - JSON-LD script rendering helpers.
- `app/shop/[locale]/layout.tsx` - internal shop locale layout.
- `app/shop/[locale]/page.tsx` - shop homepage route.
- `app/shop/[locale]/category/[slug]/page.tsx` - category route.
- `app/shop/[locale]/product/[...slugs]/page.tsx` - product and variant route.
- `app/shop/[locale]/cart/page.tsx` - local cart shell route.
- `app/shop/[locale]/checkout/page.tsx` - reserved checkout shell route.

Modify:

- `middleware.ts` - run shop redirect/rewrite before locale normalization, following B2B ordering.
- `lib/site-config.ts` - add `shopSiteUrl`.
- `components/site-locale-layout.tsx` - add `shop` variant and render shop header/footer/cart provider.
- `messages/cs.json`, `messages/uk.json`, `messages/en.json` - add `Shop` namespace.
- `package.json` - add focused shop test scripts.

Do not modify in this milestone:

- Existing B2B pages/components beyond shared middleware ordering.
- Existing repair-service pages.
- External backend API code.
- `api_docs/` unless the user asks for docs cleanup.

---

### Task 1: Shop Host Routing

**Files:**
- Create: `lib/shop-routing.ts`
- Create: `tests/shop-routing.test.mjs`
- Modify: `middleware.ts`
- Modify: `lib/site-config.ts`
- Modify: `package.json`

- [ ] **Step 1: Write routing tests**

Create `tests/shop-routing.test.mjs`:

```js
import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import ts from "typescript"

const source = await readFile(new URL("../lib/shop-routing.ts", import.meta.url), "utf8")
const middlewareSource = await readFile(new URL("../middleware.ts", import.meta.url), "utf8")
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
})

const {
  DEFAULT_SHOP_LOCALE,
  getShopRedirectTarget,
  getShopRewritePath,
  isAllowedShopPath,
  isShopHost,
  stripHostPort,
} = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(outputText)}`)

test("uses Czech as the default shop locale", () => {
  assert.equal(DEFAULT_SHOP_LOCALE, "cs")
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

test("strips ports and lowercases hosts", () => {
  assert.equal(stripHostPort("Shop.DeviceHelp.cz:3000"), "shop.devicehelp.cz")
})

test("allows localized shop catalog paths", () => {
  assert.equal(isAllowedShopPath("/"), true)
  assert.equal(isAllowedShopPath("/cs"), true)
  assert.equal(isAllowedShopPath("/uk/category/accessories"), true)
  assert.equal(isAllowedShopPath("/en/product/protective-glass"), true)
  assert.equal(isAllowedShopPath("/cs/product/protective-glass/protective-glass-iphone-11"), true)
  assert.equal(isAllowedShopPath("/cs/cart"), true)
  assert.equal(isAllowedShopPath("/cs/checkout"), true)
  assert.equal(isAllowedShopPath("/cs/checkout/success"), true)
})

test("rejects non-shop paths on shop host", () => {
  assert.equal(isAllowedShopPath("/cs/brands/apple"), false)
  assert.equal(isAllowedShopPath("/cs/services/screen-replacement"), false)
  assert.equal(isAllowedShopPath("/cs/admin"), false)
  assert.equal(isAllowedShopPath("/api/search"), false)
})

test("rewrites localized shop paths to internal app/shop routes", () => {
  assert.equal(getShopRewritePath("shop.devicehelp.cz", "/cs"), "/shop/cs")
  assert.equal(getShopRewritePath("shop.devicehelp.cz", "/uk/category/accessories"), "/shop/uk/category/accessories")
  assert.equal(
    getShopRewritePath("shop.localhost:3000", "/en/product/protective-glass/protective-glass-iphone-11"),
    "/shop/en/product/protective-glass/protective-glass-iphone-11",
  )
})

test("does not rewrite main-domain, unlocalized root, or disallowed shop paths", () => {
  assert.equal(getShopRewritePath("devicehelp.cz", "/cs"), null)
  assert.equal(getShopRewritePath("shop.devicehelp.cz", "/"), null)
  assert.equal(getShopRewritePath("shop.devicehelp.cz", "/cs/brands/apple"), null)
})

test("redirects disallowed shop paths to the main domain", () => {
  const target = getShopRedirectTarget({
    host: "shop.devicehelp.cz",
    pathname: "/cs/brands/apple",
    search: "?from=shop",
    mainBaseUrl: "https://devicehelp.cz",
  })

  assert.equal(target?.toString(), "https://devicehelp.cz/cs/brands/apple?from=shop")
})

test("does not redirect allowed shop paths", () => {
  assert.equal(
    getShopRedirectTarget({
      host: "shop.devicehelp.cz",
      pathname: "/cs/product/protective-glass",
      search: "",
      mainBaseUrl: "https://devicehelp.cz",
    }),
    null,
  )
})

test("checks shop routing before locale normalization", () => {
  const staticSkipIndex = middlewareSource.indexOf("Skip middleware for static files")
  const shopRedirectIndex = middlewareSource.indexOf("const shopRedirectTarget")
  const shopRewriteIndex = middlewareSource.indexOf("const shopRewritePath")
  const localeRedirectIndex = middlewareSource.indexOf("UNIFIED REDIRECT LOGIC")

  assert.notEqual(staticSkipIndex, -1)
  assert.notEqual(shopRedirectIndex, -1)
  assert.notEqual(shopRewriteIndex, -1)
  assert.notEqual(localeRedirectIndex, -1)
  assert.ok(staticSkipIndex < shopRedirectIndex)
  assert.ok(shopRedirectIndex < shopRewriteIndex)
  assert.ok(shopRewriteIndex < localeRedirectIndex)
})
```

- [ ] **Step 2: Run routing test and verify it fails**

Run:

```powershell
node --test tests/shop-routing.test.mjs
```

Expected: fail because `lib/shop-routing.ts` does not exist.

- [ ] **Step 3: Add shop routing helper**

Create `lib/shop-routing.ts`:

```ts
export const SUPPORTED_SHOP_LOCALES = ["cs", "uk", "en"] as const
export type SupportedShopLocale = (typeof SUPPORTED_SHOP_LOCALES)[number]

export const DEFAULT_SHOP_LOCALE: SupportedShopLocale = "cs"
export const SHOP_SUBDOMAIN = "shop"

const SHOP_ROUTE_PATTERNS = [
  /^$/,
  /^\/category\/[^/]+$/,
  /^\/product\/[^/]+$/,
  /^\/product\/[^/]+\/[^/]+$/,
  /^\/cart$/,
  /^\/checkout$/,
  /^\/checkout\/success$/,
] as const

export function stripHostPort(host: string): string {
  return host.toLowerCase().split(":")[0] ?? ""
}

export function stripTrailingSlash(pathname: string): string {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1)
  }

  return pathname
}

export function isShopHost(host: string): boolean {
  const cleanHost = stripHostPort(host)
  return cleanHost === "shop.devicehelp.cz" || cleanHost.startsWith(`${SHOP_SUBDOMAIN}.`)
}

export function getShopPathLocale(pathname: string): SupportedShopLocale | null {
  const firstSegment = pathname.split("/").filter(Boolean)[0]
  return SUPPORTED_SHOP_LOCALES.includes(firstSegment as SupportedShopLocale)
    ? (firstSegment as SupportedShopLocale)
    : null
}

export function isAllowedShopPath(pathname: string): boolean {
  const normalizedPath = stripTrailingSlash(pathname)

  if (normalizedPath === "/") {
    return true
  }

  const locale = getShopPathLocale(normalizedPath)
  if (!locale) {
    return false
  }

  const suffix = normalizedPath.replace(`/${locale}`, "") || ""
  return SHOP_ROUTE_PATTERNS.some((pattern) => pattern.test(suffix))
}

export function getDefaultLocalizedShopPath(pathname: string): string {
  const normalizedPath = stripTrailingSlash(pathname)
  const locale = getShopPathLocale(normalizedPath)

  if (locale) {
    return normalizedPath
  }

  if (normalizedPath === "/") {
    return `/${DEFAULT_SHOP_LOCALE}`
  }

  return `/${DEFAULT_SHOP_LOCALE}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`
}

export function getShopRedirectTarget({
  host,
  pathname,
  search,
  mainBaseUrl,
}: {
  host: string
  pathname: string
  search: string
  mainBaseUrl: string
}): URL | null {
  if (!isShopHost(host) || isAllowedShopPath(pathname)) {
    return null
  }

  const target = new URL(getDefaultLocalizedShopPath(pathname), mainBaseUrl)
  target.search = search
  return target
}

export function getShopRewritePath(host: string, pathname: string): string | null {
  if (!isShopHost(host)) {
    return null
  }

  const normalizedPath = stripTrailingSlash(pathname)
  const locale = getShopPathLocale(normalizedPath)

  if (!locale || !isAllowedShopPath(normalizedPath)) {
    return null
  }

  const suffix = normalizedPath.replace(`/${locale}`, "") || ""
  return `/shop/${locale}${suffix}`
}
```

- [ ] **Step 4: Wire middleware and site config**

Modify `lib/site-config.ts`:

```ts
export const shopSiteUrl =
  process.env.NEXT_PUBLIC_SHOP_SITE_URL?.replace(/\/$/, "") ?? "https://shop.devicehelp.cz"
```

Modify `middleware.ts` imports:

```ts
import { getShopRedirectTarget, getShopRewritePath } from "@/lib/shop-routing"
```

In the static skip block, add internal shop paths:

```ts
pathname === "/shop" ||
pathname.startsWith("/shop/") ||
```

Immediately after B2B redirect/rewrite handling and before old service URL normalization, add:

```ts
  const shopRedirectTarget = getShopRedirectTarget({
    host: hostname,
    pathname,
    search: request.nextUrl.search,
    mainBaseUrl: siteUrl,
  })

  if (shopRedirectTarget) {
    return NextResponse.redirect(shopRedirectTarget, { status: 308 })
  }

  const shopRewritePath = getShopRewritePath(hostname, pathname)

  if (shopRewritePath) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = shopRewritePath
    if (rewriteUrl.hostname === "localhost" || rewriteUrl.hostname === "127.0.0.1") {
      rewriteUrl.protocol = "http:"
    }
    return NextResponse.rewrite(rewriteUrl)
  }
```

Add scripts to `package.json`:

```json
"test:shop-routing": "node --test tests/shop-routing.test.mjs",
"test:shop": "node --test tests/shop-*.test.mjs"
```

- [ ] **Step 5: Run routing tests**

Run:

```powershell
npm run test:shop-routing
npm run test:b2b-routing
```

Expected: both pass.

- [ ] **Step 6: Commit routing foundation**

Run:

```powershell
git add lib/shop-routing.ts tests/shop-routing.test.mjs middleware.ts lib/site-config.ts package.json
git commit -m "Add shop host routing foundation"
```

---

### Task 2: Shop Types, Mock Data, And Normalization

**Files:**
- Create: `lib/shop/types.ts`
- Create: `lib/shop/mock-data.ts`
- Create: `lib/shop/catalog.ts`
- Create: `tests/shop-catalog.test.mjs`

- [ ] **Step 1: Write catalog tests**

Create `tests/shop-catalog.test.mjs` with tests for category lookup, product lookup, variant selection, stock labels, and normalized cards:

```js
import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import ts from "typescript"

async function importTs(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  })
  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(outputText)}`)
}

const catalog = await importTs("../lib/shop/catalog.ts")

test("returns shop homepage data for Czech", () => {
  const home = catalog.getMockShopHomeData("cs")
  assert.ok(home.categories.length >= 4)
  assert.ok(home.featuredProducts.length >= 3)
  assert.equal(home.hero.locale, "cs")
})

test("finds category by slug and returns products", () => {
  const category = catalog.getMockShopCategory("cs", "protection")
  assert.equal(category?.slug, "protection")
  assert.ok(category.products.length > 0)
})

test("selects default variant when no variant slug is supplied", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass")
  assert.equal(product?.selectedVariant.isDefault, true)
})

test("selects variant by slug override", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass", "protective-glass-iphone-11")
  assert.equal(product?.selectedVariant.slugOverride, "protective-glass-iphone-11")
})

test("limits quantity by tracked stock", () => {
  assert.equal(catalog.getMaxPurchasableQuantity({ trackInventory: true, availableStock: 3 }), 3)
  assert.equal(catalog.getMaxPurchasableQuantity({ trackInventory: true, availableStock: 0 }), 0)
  assert.equal(catalog.getMaxPurchasableQuantity({ trackInventory: false, availableStock: null }), 99)
})

test("formats CZK prices", () => {
  assert.equal(catalog.formatShopPrice(249, "cs"), "249 Kč")
})
```

- [ ] **Step 2: Run catalog test and verify it fails**

Run:

```powershell
node --test tests/shop-catalog.test.mjs
```

Expected: fail because `lib/shop/catalog.ts` does not exist.

- [ ] **Step 3: Create shop types**

Create `lib/shop/types.ts`:

```ts
export type ShopLocale = "cs" | "uk" | "en"
export type ShopCurrency = "CZK"
export type ShopAvailability = "in_stock" | "out_of_stock" | "preorder" | "backorder"

export interface ShopLocalizedText {
  cs?: string
  uk?: string
  en?: string
}

export interface ShopSeoLocale {
  metaTitle: string
  metaDescription: string | null
  ogTitle: string
  ogDescription: string | null
  ogImage: string | null
  canonicalUrl: string
  robots: string
  indexable: boolean
  structuredDataFacts: ShopStructuredDataFacts
  structuredData: Record<string, unknown>
  warnings: string[]
}

export interface ShopSeo {
  profile: "PRODUCT_DETAIL" | "CATEGORY_LISTING" | "SHOP_HOME"
  schemaType: "Product" | "ProductGroup" | "CollectionPage" | "WebPage"
  indexable: boolean
  robots: string
  canonicalPathHint: string
  canonicalUrl: string
  locales: Partial<Record<ShopLocale, ShopSeoLocale>>
}

export interface ShopStructuredDataFacts {
  kind: "product" | "category" | "home"
  schemaType: "Product" | "ProductGroup" | "CollectionPage" | "WebPage"
  canonicalUrl: string
  name: string
  description?: string
  image?: string
  brand?: string
  condition?: "new" | "used" | "refurbished"
  price?: number
  salePrice?: number | null
  currency?: ShopCurrency
  sku?: string
  gtin?: string
  mpn?: string
  availability?: ShopAvailability
  variants?: ShopStructuredVariantFacts[]
}

export interface ShopStructuredVariantFacts {
  id: string
  slug: string
  title: string
  canonicalUrl: string
  price: number
  salePrice: number | null
  currency: ShopCurrency
  sku: string
  barcode?: string
  gtin?: string
  mpn?: string
  availability: ShopAvailability
}

export interface ShopCategory {
  id: string
  parentId: string | null
  title: ShopLocalizedText
  slug: string
  description: ShopLocalizedText
  imageUrl: string | null
  position: number
  isActive: boolean
  seo: ShopSeo
}

export interface ShopVariant {
  id: string
  itemId: string
  title: ShopLocalizedText
  slugOverride: string | null
  price: number
  salePrice: number | null
  sku: string
  barcode?: string
  gtin?: string
  mpn?: string
  isDefault: boolean
  trackInventory: boolean
  selectedOptions: Array<{
    attributeSlug: string
    attributeTitle: ShopLocalizedText
    optionSlug: string
    optionTitle: ShopLocalizedText
  }>
  images: string[]
  availability: {
    availableStock: number | null
  }
}

export interface ShopItem {
  id: string
  title: ShopLocalizedText
  slug: string
  description: ShopLocalizedText
  content: ShopLocalizedText
  images: string[]
  brand?: string
  condition?: "new" | "used" | "refurbished"
  categories: ShopCategory[]
  variants: ShopVariant[]
  linkedItems: Array<{ type: "cross_sell" | "upsell" | "accessory" | "related"; targetSlug: string }>
  seo: ShopSeo
}

export interface ShopProductCardView {
  itemId: string
  slug: string
  title: string
  image: string
  price: number
  salePrice: number | null
  currency: ShopCurrency
  href: string
  availabilityLabel: string
  availableStock: number | null
  isPurchasable: boolean
}
```

- [ ] **Step 4: Create mock data**

Create `lib/shop/mock-data.ts` exporting categories and items. Include these initial slugs:

```ts
import type { ShopCategory, ShopItem, ShopLocale, ShopSeo, ShopStructuredDataFacts } from "./types"

export const SHOP_LOCALES: ShopLocale[] = ["cs", "uk", "en"]

export function localized(cs: string, uk: string, en: string) {
  return { cs, uk, en }
}

function seo({
  profile,
  schemaType,
  canonicalUrl,
  title,
  description,
  facts,
}: {
  profile: ShopSeo["profile"]
  schemaType: ShopSeo["schemaType"]
  canonicalUrl: string
  title: string
  description: string
  facts: ShopStructuredDataFacts
}): ShopSeo {
  return {
    profile,
    schemaType,
    indexable: true,
    robots: "index,follow",
    canonicalPathHint: new URL(canonicalUrl).pathname,
    canonicalUrl,
    locales: {
      cs: {
        metaTitle: title,
        metaDescription: description,
        ogTitle: title,
        ogDescription: description,
        ogImage: facts.image ?? null,
        canonicalUrl,
        robots: "index,follow",
        indexable: true,
        structuredDataFacts: facts,
        structuredData: {},
        warnings: [],
      },
    },
  }
}

export const mockShopCategories: ShopCategory[] = [
  {
    id: "cat-protection",
    parentId: null,
    slug: "protection",
    title: localized("Ochrana telefonu", "Захист телефону", "Phone protection"),
    description: localized("Skla, pouzdra a ochrana displeje.", "Скло, чохли та захист дисплея.", "Glass, cases, and display protection."),
    imageUrl: "/placeholder.jpg",
    position: 1,
    isActive: true,
    seo: seo({
      profile: "CATEGORY_LISTING",
      schemaType: "CollectionPage",
      canonicalUrl: "https://shop.devicehelp.cz/cs/category/protection",
      title: "Ochrana telefonu | DeviceHelp Shop",
      description: "Ochranná skla, pouzdra a příslušenství pro telefony.",
      facts: {
        kind: "category",
        schemaType: "CollectionPage",
        canonicalUrl: "https://shop.devicehelp.cz/cs/category/protection",
        name: "Ochrana telefonu",
      },
    }),
  },
  {
    id: "cat-charging",
    parentId: null,
    slug: "charging",
    title: localized("Nabíjení", "Заряджання", "Charging"),
    description: localized("Nabíječky, kabely a adaptéry.", "Зарядні пристрої, кабелі та адаптери.", "Chargers, cables, and adapters."),
    imageUrl: "/placeholder.jpg",
    position: 2,
    isActive: true,
    seo: seo({
      profile: "CATEGORY_LISTING",
      schemaType: "CollectionPage",
      canonicalUrl: "https://shop.devicehelp.cz/cs/category/charging",
      title: "Nabíjení | DeviceHelp Shop",
      description: "Kabely, nabíječky a adaptéry pro mobilní telefony.",
      facts: {
        kind: "category",
        schemaType: "CollectionPage",
        canonicalUrl: "https://shop.devicehelp.cz/cs/category/charging",
        name: "Nabíjení",
      },
    }),
  },
  {
    id: "cat-parts",
    parentId: null,
    slug: "parts",
    title: localized("Náhradní díly", "Запчастини", "Replacement parts"),
    description: localized("Díly pro servis telefonů.", "Деталі для ремонту телефонів.", "Parts for phone repair."),
    imageUrl: "/placeholder.jpg",
    position: 3,
    isActive: true,
    seo: seo({
      profile: "CATEGORY_LISTING",
      schemaType: "CollectionPage",
      canonicalUrl: "https://shop.devicehelp.cz/cs/category/parts",
      title: "Náhradní díly | DeviceHelp Shop",
      description: "Náhradní díly vybrané servisním týmem DeviceHelp.",
      facts: {
        kind: "category",
        schemaType: "CollectionPage",
        canonicalUrl: "https://shop.devicehelp.cz/cs/category/parts",
        name: "Náhradní díly",
      },
    }),
  },
  {
    id: "cat-phones",
    parentId: null,
    slug: "phones",
    title: localized("Telefony", "Телефони", "Phones"),
    description: localized("Budoucí nabídka telefonů.", "Майбутня пропозиція телефонів.", "Future phone offer."),
    imageUrl: "/placeholder.jpg",
    position: 4,
    isActive: true,
    seo: seo({
      profile: "CATEGORY_LISTING",
      schemaType: "CollectionPage",
      canonicalUrl: "https://shop.devicehelp.cz/cs/category/phones",
      title: "Telefony | DeviceHelp Shop",
      description: "Telefony připravované pro prodej v DeviceHelp Shop.",
      facts: {
        kind: "category",
        schemaType: "CollectionPage",
        canonicalUrl: "https://shop.devicehelp.cz/cs/category/phones",
        name: "Telefony",
      },
    }),
  },
]

export const mockShopItems: ShopItem[] = [
  {
    id: "item-protective-glass",
    slug: "protective-glass",
    title: localized("Prémiové ochranné sklo", "Преміальне захисне скло", "Premium protective glass"),
    description: localized("Tenké ochranné sklo s přesným výřezem.", "Тонке захисне скло з точною посадкою.", "Thin protective glass with precise fit."),
    content: localized("Doporučeno servisem DeviceHelp.", "Рекомендовано сервісом DeviceHelp.", "Recommended by DeviceHelp service."),
    images: ["/placeholder.jpg"],
    brand: "DeviceHelp",
    condition: "new",
    categories: [mockShopCategories[0]],
    linkedItems: [{ type: "accessory", targetSlug: "usb-c-cable" }],
    variants: [
      {
        id: "variant-glass-default",
        itemId: "item-protective-glass",
        title: localized("iPhone 13", "iPhone 13", "iPhone 13"),
        slugOverride: "protective-glass-iphone-13",
        price: 249,
        salePrice: null,
        sku: "GLASS-IP13",
        barcode: "INTERNAL-GLASS-IP13",
        gtin: "00012345678905",
        mpn: "GLASS-IP13",
        isDefault: true,
        trackInventory: true,
        selectedOptions: [
          {
            attributeSlug: "model",
            attributeTitle: localized("Model", "Модель", "Model"),
            optionSlug: "iphone-13",
            optionTitle: localized("iPhone 13", "iPhone 13", "iPhone 13"),
          },
        ],
        images: ["/placeholder.jpg"],
        availability: { availableStock: 7 },
      },
      {
        id: "variant-glass-iphone-11",
        itemId: "item-protective-glass",
        title: localized("iPhone 11", "iPhone 11", "iPhone 11"),
        slugOverride: "protective-glass-iphone-11",
        price: 229,
        salePrice: 199,
        sku: "GLASS-IP11",
        barcode: "INTERNAL-GLASS-IP11",
        gtin: "00012345678912",
        mpn: "GLASS-IP11",
        isDefault: false,
        trackInventory: true,
        selectedOptions: [
          {
            attributeSlug: "model",
            attributeTitle: localized("Model", "Модель", "Model"),
            optionSlug: "iphone-11",
            optionTitle: localized("iPhone 11", "iPhone 11", "iPhone 11"),
          },
        ],
        images: ["/placeholder.jpg"],
        availability: { availableStock: 3 },
      },
    ],
    seo: seo({
      profile: "PRODUCT_DETAIL",
      schemaType: "ProductGroup",
      canonicalUrl: "https://shop.devicehelp.cz/cs/product/protective-glass",
      title: "Prémiové ochranné sklo | DeviceHelp Shop",
      description: "Prémiové ochranné sklo pro iPhone s dostupností podle modelu.",
      facts: {
        kind: "product",
        schemaType: "ProductGroup",
        canonicalUrl: "https://shop.devicehelp.cz/cs/product/protective-glass",
        name: "Prémiové ochranné sklo",
        description: "Prémiové ochranné sklo pro iPhone.",
        image: "/placeholder.jpg",
        brand: "DeviceHelp",
        condition: "new",
        price: 249,
        salePrice: null,
        currency: "CZK",
        sku: "GLASS-IP13",
        gtin: "00012345678905",
        mpn: "GLASS-IP13",
        availability: "in_stock",
      },
    }),
  },
]
```

In the same file, add three more `ShopItem` objects with these exact slugs and category assignments:

- `usb-c-cable` in category `charging`, default variant `variant-usb-c-cable-default`, price `299`, stock `12`.
- `magsafe-charger` in category `charging`, default variant `variant-magsafe-charger-default`, price `890`, sale price `790`, stock `5`.
- `iphone-battery` in category `parts`, default variant `variant-iphone-battery-13`, price `1190`, stock `2`.

Use the same object shape as `item-protective-glass`, unique `sku` values, `condition: "new"`, and `seo` records whose canonical URLs follow `https://shop.devicehelp.cz/cs/product/{slug}`.

- [ ] **Step 5: Create catalog helpers**

Create `lib/shop/catalog.ts`:

```ts
import { mockShopCategories, mockShopItems } from "./mock-data"
import type { ShopItem, ShopLocale, ShopProductCardView, ShopVariant } from "./types"

export function getLocalizedText(value: Record<string, string | undefined>, locale: ShopLocale): string {
  return value[locale] ?? value.cs ?? value.en ?? ""
}

export function formatShopPrice(amount: number, locale: ShopLocale): string {
  return new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : locale === "uk" ? "uk-UA" : "en-US", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getMaxPurchasableQuantity(variant: Pick<ShopVariant, "trackInventory" | "availability">): number {
  if (!variant.trackInventory || variant.availability.availableStock === null) {
    return 99
  }

  return Math.max(0, variant.availability.availableStock)
}

export function isVariantPurchasable(variant: ShopVariant): boolean {
  return getMaxPurchasableQuantity(variant) > 0
}

export function getAvailabilityLabel(variant: ShopVariant, locale: ShopLocale): string {
  if (!variant.trackInventory || variant.availability.availableStock === null) {
    return locale === "cs" ? "Dostupné" : locale === "uk" ? "Доступно" : "Available"
  }

  if (variant.availability.availableStock <= 0) {
    return locale === "cs" ? "Není skladem" : locale === "uk" ? "Немає в наявності" : "Out of stock"
  }

  return locale === "cs"
    ? `Skladem ${variant.availability.availableStock} ks`
    : locale === "uk"
      ? `В наявності ${variant.availability.availableStock} шт.`
      : `${variant.availability.availableStock} in stock`
}

export function selectProductVariant(item: ShopItem, variantSlug?: string): ShopVariant {
  const bySlug = variantSlug ? item.variants.find((variant) => variant.slugOverride === variantSlug) : null
  return bySlug ?? item.variants.find((variant) => variant.isDefault) ?? item.variants[0]
}

export function toProductCard(item: ShopItem, locale: ShopLocale): ShopProductCardView {
  const variant = selectProductVariant(item)

  return {
    itemId: item.id,
    slug: item.slug,
    title: getLocalizedText(item.title, locale),
    image: variant.images[0] ?? item.images[0] ?? "/placeholder.jpg",
    price: variant.price,
    salePrice: variant.salePrice,
    currency: "CZK",
    href: `/${locale}/product/${item.slug}`,
    availabilityLabel: getAvailabilityLabel(variant, locale),
    availableStock: variant.availability.availableStock,
    isPurchasable: isVariantPurchasable(variant),
  }
}

export function getMockShopHomeData(locale: ShopLocale) {
  return {
    hero: {
      locale,
      title:
        locale === "cs"
          ? "Prémiové příslušenství a díly pro telefony"
          : locale === "uk"
            ? "Преміальні аксесуари та деталі для телефонів"
            : "Premium phone accessories and parts",
    },
    categories: mockShopCategories,
    featuredProducts: mockShopItems.map((item) => toProductCard(item, locale)),
  }
}

export function getMockShopCategory(locale: ShopLocale, slug: string) {
  const category = mockShopCategories.find((item) => item.slug === slug && item.isActive)
  if (!category) {
    return null
  }

  const products = mockShopItems
    .filter((item) => item.categories.some((itemCategory) => itemCategory.slug === slug))
    .map((item) => toProductCard(item, locale))

  return { category, products }
}

export function getMockShopProduct(locale: ShopLocale, itemSlug: string, variantSlug?: string) {
  const item = mockShopItems.find((product) => product.slug === itemSlug)
  if (!item) {
    return null
  }

  const selectedVariant = selectProductVariant(item, variantSlug)
  const relatedItems = item.linkedItems
    .map((link) => mockShopItems.find((product) => product.slug === link.targetSlug))
    .filter((product): product is ShopItem => Boolean(product))
    .map((product) => toProductCard(product, locale))

  return { item, selectedVariant, relatedItems }
}
```

- [ ] **Step 6: Run catalog tests**

Run:

```powershell
node --test tests/shop-catalog.test.mjs
```

Expected: pass.

- [ ] **Step 7: Commit catalog foundation**

Run:

```powershell
git add lib/shop/types.ts lib/shop/mock-data.ts lib/shop/catalog.ts tests/shop-catalog.test.mjs
git commit -m "Add shop mock catalog foundation"
```

---

### Task 3: Shop SEO Utilities

**Files:**
- Create: `lib/shop/seo.ts`
- Create: `components/shop/structured-data.tsx`
- Create: `tests/shop-seo.test.mjs`

- [ ] **Step 1: Write SEO tests**

Create `tests/shop-seo.test.mjs`:

```js
import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import ts from "typescript"

async function importTs(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  })
  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(outputText)}`)
}

const catalog = await importTs("../lib/shop/catalog.ts")
const seo = await importTs("../lib/shop/seo.ts")

test("builds metadata from localized SEO", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass")
  const metadata = seo.buildShopMetadata({
    locale: "cs",
    seo: product.item.seo,
    fallbackTitle: "Fallback",
    fallbackDescription: "Fallback description",
  })

  assert.equal(metadata.alternates.canonical, "https://shop.devicehelp.cz/cs/product/protective-glass")
  assert.match(metadata.title, /ochrann/i)
})

test("builds ProductGroup JSON-LD with variants", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass")
  const jsonLd = seo.buildProductJsonLd(product.item, product.selectedVariant, "cs")

  assert.equal(jsonLd["@type"], "ProductGroup")
  assert.ok(Array.isArray(jsonLd.hasVariant))
  assert.ok(jsonLd.hasVariant.length >= 1)
})

test("builds breadcrumb JSON-LD", () => {
  const product = catalog.getMockShopProduct("cs", "protective-glass")
  const jsonLd = seo.buildBreadcrumbJsonLd("cs", [
    { name: "Shop", url: "https://shop.devicehelp.cz/cs" },
    { name: "Ochrana telefonu", url: "https://shop.devicehelp.cz/cs/category/protection" },
    { name: "Prémiové ochranné sklo", url: product.item.seo.locales.cs.canonicalUrl },
  ])

  assert.equal(jsonLd["@type"], "BreadcrumbList")
  assert.equal(jsonLd.itemListElement.length, 3)
})
```

- [ ] **Step 2: Run SEO test and verify it fails**

Run:

```powershell
node --test tests/shop-seo.test.mjs
```

Expected: fail because `lib/shop/seo.ts` does not exist.

- [ ] **Step 3: Implement SEO helpers**

Create `lib/shop/seo.ts`:

```ts
import type { Metadata } from "next"

import { toOGLocale } from "@/lib/og-locale"
import { shopSiteUrl } from "@/lib/site-config"
import type { ShopItem, ShopLocale, ShopSeo, ShopVariant } from "./types"
import { getLocalizedText } from "./catalog"

export function buildShopMetadata({
  locale,
  seo,
  fallbackTitle,
  fallbackDescription,
}: {
  locale: ShopLocale
  seo: ShopSeo
  fallbackTitle: string
  fallbackDescription: string
}): Metadata {
  const localizedSeo = seo.locales[locale] ?? seo.locales.cs
  const canonicalUrl = localizedSeo?.canonicalUrl ?? seo.canonicalUrl
  const title = localizedSeo?.metaTitle ?? fallbackTitle
  const description = localizedSeo?.metaDescription ?? fallbackDescription

  return {
    title,
    description,
    metadataBase: new URL(shopSiteUrl),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: localizedSeo?.robots ?? seo.robots,
    openGraph: {
      title: localizedSeo?.ogTitle ?? title,
      description: localizedSeo?.ogDescription ?? description,
      url: canonicalUrl,
      siteName: "DeviceHelp Shop",
      locale: toOGLocale(locale),
      type: "website",
      images: localizedSeo?.ogImage ? [localizedSeo.ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: localizedSeo?.ogTitle ?? title,
      description: localizedSeo?.ogDescription ?? description,
    },
  }
}

export function availabilityToSchema(availability: string): string {
  if (availability === "out_of_stock") {
    return "https://schema.org/OutOfStock"
  }
  if (availability === "preorder") {
    return "https://schema.org/PreOrder"
  }
  if (availability === "backorder") {
    return "https://schema.org/BackOrder"
  }
  return "https://schema.org/InStock"
}

export function buildProductJsonLd(item: ShopItem, selectedVariant: ShopVariant, locale: ShopLocale) {
  const facts = item.seo.locales[locale]?.structuredDataFacts ?? item.seo.locales.cs?.structuredDataFacts
  const variants = item.variants.map((variant) => ({
    "@type": "Product",
    name: `${getLocalizedText(item.title, locale)} - ${getLocalizedText(variant.title, locale)}`,
    sku: variant.sku,
    gtin: variant.gtin,
    mpn: variant.mpn,
    url: `${item.seo.locales[locale]?.canonicalUrl ?? item.seo.canonicalUrl}${variant.slugOverride ? `/${variant.slugOverride}` : ""}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "CZK",
      price: String(variant.salePrice ?? variant.price),
      availability: availabilityToSchema(
        variant.availability.availableStock === 0 ? "out_of_stock" : facts?.availability ?? "in_stock",
      ),
    },
  }))

  return {
    "@context": "https://schema.org",
    "@type": facts?.schemaType ?? "ProductGroup",
    name: getLocalizedText(item.title, locale),
    description: getLocalizedText(item.description, locale),
    image: selectedVariant.images[0] ?? item.images[0],
    brand: item.brand ? { "@type": "Brand", name: item.brand } : undefined,
    sku: selectedVariant.sku,
    gtin: selectedVariant.gtin,
    mpn: selectedVariant.mpn,
    url: item.seo.locales[locale]?.canonicalUrl ?? item.seo.canonicalUrl,
    hasVariant: variants,
  }
}

export function buildBreadcrumbJsonLd(_locale: ShopLocale, items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
```

Create `components/shop/structured-data.tsx`:

```tsx
interface StructuredDataProps {
  id: string
  data: Record<string, unknown>
}

export function StructuredData({ id, data }: StructuredDataProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

- [ ] **Step 4: Run SEO tests**

Run:

```powershell
node --test tests/shop-seo.test.mjs
```

Expected: pass.

- [ ] **Step 5: Commit SEO utilities**

Run:

```powershell
git add lib/shop/seo.ts components/shop/structured-data.tsx tests/shop-seo.test.mjs
git commit -m "Add shop SEO helpers"
```

---

### Task 4: Shop Layout, Header, Footer, And Localized Copy

**Files:**
- Create: `components/shop/shop-cart-provider.tsx`
- Create: `components/shop/shop-header.tsx`
- Create: `components/shop/shop-footer.tsx`
- Modify: `components/site-locale-layout.tsx`
- Modify: `messages/cs.json`
- Modify: `messages/uk.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add cart provider shell**

Create `components/shop/shop-cart-provider.tsx`:

```tsx
"use client"

import type React from "react"
import { createContext, useContext, useMemo, useReducer } from "react"

import type { ShopCurrency } from "@/lib/shop/types"

export interface ShopCartLine {
  variantId: string
  itemId: string
  quantity: number
  titleSnapshot: string
  priceSnapshot: number
  currency: ShopCurrency
}

interface ShopCartState {
  lines: ShopCartLine[]
}

type ShopCartAction =
  | { type: "add"; line: ShopCartLine; maxQuantity: number }
  | { type: "remove"; variantId: string }
  | { type: "setQuantity"; variantId: string; quantity: number; maxQuantity: number }
  | { type: "clear" }

function clampQuantity(quantity: number, maxQuantity: number): number {
  return Math.max(1, Math.min(quantity, maxQuantity))
}

export function shopCartReducer(state: ShopCartState, action: ShopCartAction): ShopCartState {
  if (action.type === "clear") {
    return { lines: [] }
  }

  if (action.type === "remove") {
    return { lines: state.lines.filter((line) => line.variantId !== action.variantId) }
  }

  if (action.type === "setQuantity") {
    return {
      lines: state.lines.map((line) =>
        line.variantId === action.variantId
          ? { ...line, quantity: clampQuantity(action.quantity, action.maxQuantity) }
          : line,
      ),
    }
  }

  const existing = state.lines.find((line) => line.variantId === action.line.variantId)
  if (!existing) {
    return { lines: [{ ...action.line, quantity: clampQuantity(action.line.quantity, action.maxQuantity) }] }
  }

  return {
    lines: state.lines.map((line) =>
      line.variantId === action.line.variantId
        ? { ...line, quantity: clampQuantity(line.quantity + action.line.quantity, action.maxQuantity) }
        : line,
    ),
  }
}

const ShopCartContext = createContext<{
  lines: ShopCartLine[]
  count: number
  addLine: (line: ShopCartLine, maxQuantity: number) => void
} | null>(null)

export function ShopCartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(shopCartReducer, { lines: [] })
  const count = state.lines.reduce((sum, line) => sum + line.quantity, 0)

  const value = useMemo(
    () => ({
      lines: state.lines,
      count,
      addLine: (line: ShopCartLine, maxQuantity: number) => dispatch({ type: "add", line, maxQuantity }),
    }),
    [state.lines, count],
  )

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>
}

export function useShopCart() {
  const context = useContext(ShopCartContext)
  if (!context) {
    throw new Error("useShopCart must be used inside ShopCartProvider")
  }
  return context
}
```

- [ ] **Step 2: Add shop header and footer**

Create `components/shop/shop-header.tsx`:

```tsx
"use client"

import Link from "next/link"
import { Search, ShoppingBag } from "lucide-react"
import { useTranslations } from "next-intl"

import { LanguageSwitcher } from "@/components/language-switcher"
import { SiteLogo } from "@/components/site-logo"
import { Button } from "@/components/ui/button"
import { useShopCart } from "@/components/shop/shop-cart-provider"

export function ShopHeader({ locale }: { locale: string }) {
  const t = useTranslations("Shop.header")
  const { count } = useShopCart()
  const navItems = [
    { label: t("protection"), href: `/${locale}/category/protection` },
    { label: t("charging"), href: `/${locale}/category/charging` },
    { label: t("parts"), href: `/${locale}/category/parts` },
    { label: t("phones"), href: `/${locale}/category/phones` },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <SiteLogo size="md" />
          <span className="text-sm font-semibold tracking-tight text-gray-950">DeviceHelp Shop</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-gray-700 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-gray-950">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden gap-2 md:inline-flex">
            <Search className="h-4 w-4" />
            {t("search")}
          </Button>
          <LanguageSwitcher />
          <Link
            href={`/${locale}/cart`}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-800 hover:bg-gray-50"
            aria-label={t("cart")}
          >
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
```

Create `components/shop/shop-footer.tsx`:

```tsx
"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { useTranslations } from "next-intl"

import { useCookieConsentContext } from "@/contexts/cookie-consent-context"

export function ShopFooter({ locale }: { locale: string }) {
  const t = useTranslations("Shop.footer")
  const { setShowBanner } = useCookieConsentContext()

  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="container grid gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-950">DeviceHelp Shop</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">{t("tagline")}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-950">{t("shopping")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href={`/${locale}/category/protection`}>{t("protection")}</Link></li>
            <li><Link href={`/${locale}/category/charging`}>{t("charging")}</Link></li>
            <li><Link href={`/${locale}/category/parts`}>{t("parts")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-950">{t("support")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href={`/${locale}/terms`}>{t("terms")}</Link></li>
            <li><Link href={`/${locale}/privacy`}>{t("privacy")}</Link></li>
            <li><Link href={`/${locale}/contact`}>{t("contact")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-950">{t("devicehelp")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><a href={`https://devicehelp.cz/${locale}`}>{t("repairSite")}</a></li>
            <li><a href={`https://b2b.devicehelp.cz/${locale}`}>{t("b2b")}</a></li>
            <li>
              <button onClick={() => setShowBanner(true)} className="inline-flex items-center gap-1 hover:text-gray-950">
                <Settings className="h-3 w-3" />
                {t("cookieSettings")}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Wire SiteLocaleLayout shop variant**

Modify `components/site-locale-layout.tsx`:

```tsx
import { ShopCartProvider } from "@/components/shop/shop-cart-provider"
import { ShopFooter } from "@/components/shop/shop-footer"
import { ShopHeader } from "@/components/shop/shop-header"
```

Update type:

```ts
export type SiteLayoutVariant = "default" | "b2b" | "shop"
```

Inside the returned body, replace the current header/main/footer block with:

```tsx
<div className="flex min-h-screen flex-col">
  {showPromotionalBanner && (
    <Suspense fallback={null}>
      <PromotionalBanner locale={locale} />
    </Suspense>
  )}
  {variant === "shop" ? (
    <ShopCartProvider>
      <ShopHeader locale={locale} />
      <main className="flex-1">{children}</main>
      <ShopFooter locale={locale} />
    </ShopCartProvider>
  ) : (
    <>
      <Header variant={variant} mainDomainBaseUrl={mainSiteUrl} localeOverride={locale} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )}
  <CookieBanner />
</div>
```

- [ ] **Step 4: Add message namespaces**

Add a `Shop` namespace to `messages/cs.json`, `messages/uk.json`, and `messages/en.json`.

Czech:

```json
"Shop": {
  "header": {
    "protection": "Ochrana",
    "charging": "Nabíjení",
    "parts": "Díly",
    "phones": "Telefony",
    "search": "Hledat",
    "cart": "Košík"
  },
  "footer": {
    "tagline": "Prémiové příslušenství, díly a budoucí telefony od DeviceHelp.",
    "shopping": "Nakupování",
    "support": "Podpora",
    "devicehelp": "DeviceHelp",
    "protection": "Ochrana telefonu",
    "charging": "Nabíjení",
    "parts": "Náhradní díly",
    "terms": "Obchodní podmínky",
    "privacy": "Ochrana osobních údajů",
    "contact": "Kontakt",
    "repairSite": "Servis telefonů",
    "b2b": "Firemní servis",
    "cookieSettings": "Nastavení cookies"
  }
}
```

Use equivalent Ukrainian and English translations.

- [ ] **Step 5: Run type check**

Run:

```powershell
npm run build
```

Expected: build completes successfully. If it fails in files unrelated to this shop work, record the failing file paths and command output before continuing; if it fails in shop files, fix the shop files in this task.

- [ ] **Step 6: Commit shop layout shell**

Run:

```powershell
git add components/site-locale-layout.tsx components/shop/shop-cart-provider.tsx components/shop/shop-header.tsx components/shop/shop-footer.tsx messages/cs.json messages/uk.json messages/en.json
git commit -m "Add shop layout shell"
```

---

### Task 5: Shop Homepage Route

**Files:**
- Create: `app/shop/[locale]/layout.tsx`
- Create: `app/shop/[locale]/page.tsx`
- Create: `components/shop/shop-home-page.tsx`

- [ ] **Step 1: Add internal shop locale layout**

Create `app/shop/[locale]/layout.tsx`:

```tsx
import type React from "react"

import { SiteLocaleLayout } from "@/components/site-locale-layout"
import "@/app/globals.css"

export default async function ShopLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <SiteLocaleLayout
      locale={locale}
      variant="shop"
      showPromotionalBanner={false}
      includeLocalBusinessSchema={false}
    >
      {children}
    </SiteLocaleLayout>
  )
}
```

- [ ] **Step 2: Add homepage component**

Create `components/shop/shop-home-page.tsx`:

```tsx
import Link from "next/link"
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react"

import { ProductCard } from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import { getLocalizedText } from "@/lib/shop/catalog"
import type { ShopCategory, ShopLocale, ShopProductCardView } from "@/lib/shop/types"

export function ShopHomePage({
  locale,
  heroTitle,
  categories,
  featuredProducts,
}: {
  locale: ShopLocale
  heroTitle: string
  categories: ShopCategory[]
  featuredProducts: ShopProductCardView[]
}) {
  return (
    <div className="bg-white text-gray-950">
      <section className="border-b border-gray-100">
        <div className="container grid gap-10 px-4 py-10 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-gray-500">DeviceHelp Shop</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-gray-950 md:text-6xl">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600">
              Premium accessories, parts, and future phone offers selected by the DeviceHelp repair team.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={`/${locale}/category/protection`}>
                  Browse products
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/${locale}/category/parts`}>Repair parts</Link>
              </Button>
            </div>
          </div>
          <div className="grid min-h-[360px] gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
            {featuredProducts.slice(0, 2).map((product) => (
              <ProductCard key={product.itemId} locale={locale} product={product} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="container px-4 py-12 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Shop categories</h2>
            <p className="mt-2 text-sm text-gray-600">Start with protection, charging, parts, or phones.</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/category/${category.slug}`}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="aspect-[4/3] rounded-md bg-gray-100" />
              <h3 className="mt-4 font-semibold">{getLocalizedText(category.title, locale)}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {getLocalizedText(category.description, locale)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-100 bg-gray-50 py-12">
        <div className="container grid gap-4 px-4 md:grid-cols-3 md:px-6">
          {[
            { icon: ShieldCheck, title: "Checked compatibility", text: "Product options stay tied to exact variants." },
            { icon: Truck, title: "Delivery ready", text: "Packeta support is prepared for checkout." },
            { icon: Sparkles, title: "Selected by service", text: "Products align with DeviceHelp repair expertise." },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5">
                <Icon className="h-5 w-5 text-gray-900" />
                <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="container px-4 py-12 md:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Recommended products</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.itemId} locale={locale} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Add product card used by homepage**

Create `components/shop/product-card.tsx`:

```tsx
import Link from "next/link"

import { formatShopPrice } from "@/lib/shop/catalog"
import type { ShopLocale, ShopProductCardView } from "@/lib/shop/types"

export function ProductCard({
  product,
  locale,
  compact = false,
}: {
  product: ShopProductCardView
  locale: ShopLocale
  compact?: boolean
}) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <Link href={product.href} className="block">
        <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
          <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
        </div>
        <div className={compact ? "mt-3" : "mt-4"}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-gray-950">{product.title}</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-semibold">{formatShopPrice(product.salePrice ?? product.price, locale)}</span>
            {product.salePrice && (
              <span className="text-sm text-gray-400 line-through">{formatShopPrice(product.price, locale)}</span>
            )}
          </div>
          <p className="mt-2 text-xs font-medium text-gray-500">{product.availabilityLabel}</p>
        </div>
      </Link>
    </article>
  )
}
```

- [ ] **Step 4: Add homepage route**

Create `app/shop/[locale]/page.tsx`:

```tsx
import type { Metadata } from "next"

import { ShopHomePage } from "@/components/shop/shop-home-page"
import { getMockShopHomeData } from "@/lib/shop/catalog"
import { shopSiteUrl } from "@/lib/site-config"
import type { ShopLocale } from "@/lib/shop/types"

const SUPPORTED_LOCALE_PARAMS = [{ locale: "cs" }, { locale: "uk" }, { locale: "en" }]

export const revalidate = 3600

export function generateStaticParams() {
  return SUPPORTED_LOCALE_PARAMS
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: ShopLocale }>
}): Promise<Metadata> {
  const { locale } = await params
  const canonicalUrl = `${shopSiteUrl}/${locale}`

  return {
    title: "DeviceHelp Shop",
    description: "Premium phone accessories, parts, and future phone offers from DeviceHelp.",
    metadataBase: new URL(shopSiteUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        cs: `${shopSiteUrl}/cs`,
        uk: `${shopSiteUrl}/uk`,
        en: `${shopSiteUrl}/en`,
        "x-default": `${shopSiteUrl}/cs`,
      },
    },
  }
}

export default async function ShopHomeRoute({ params }: { params: Promise<{ locale: ShopLocale }> }) {
  const { locale } = await params
  const data = getMockShopHomeData(locale)

  return (
    <ShopHomePage
      locale={locale}
      heroTitle={data.hero.title}
      categories={data.categories}
      featuredProducts={data.featuredProducts}
    />
  )
}
```

- [ ] **Step 5: Run focused checks**

Run:

```powershell
npm run test:shop-routing
npm run test:shop
npm run build
```

Expected: shop tests pass and build completes successfully. If build fails in pre-existing unrelated files, record the failing file paths and command output before continuing.

- [ ] **Step 6: Commit homepage milestone**

Run:

```powershell
git add app/shop components/shop lib/shop package.json messages/cs.json messages/uk.json messages/en.json
git commit -m "Add shop homepage on mock catalog"
```

---

### Task 6: Category Page

**Files:**
- Create: `app/shop/[locale]/category/[slug]/page.tsx`
- Create: `components/shop/category-page.tsx`

- [ ] **Step 1: Add category component**

Create `components/shop/category-page.tsx`:

```tsx
import Link from "next/link"

import { ProductCard } from "@/components/shop/product-card"
import { getLocalizedText } from "@/lib/shop/catalog"
import type { ShopCategory, ShopLocale, ShopProductCardView } from "@/lib/shop/types"

export function CategoryPage({
  locale,
  category,
  products,
}: {
  locale: ShopLocale
  category: ShopCategory
  products: ShopProductCardView[]
}) {
  return (
    <div className="bg-white text-gray-950">
      <div className="container px-4 py-8 md:px-6">
        <nav className="text-sm text-gray-500">
          <Link href={`/${locale}`} className="hover:text-gray-900">Shop</Link>
          <span className="mx-2">/</span>
          <span>{getLocalizedText(category.title, locale)}</span>
        </nav>
        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold">Filters</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Attribute filters are UI-only in this milestone. Filtered URLs stay noindex in production unless exposed as SEO landing pages.
            </p>
          </aside>
          <main>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              {getLocalizedText(category.title, locale)}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">
              {getLocalizedText(category.description, locale)}
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.itemId} locale={locale} product={product} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add category route**

Create `app/shop/[locale]/category/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CategoryPage } from "@/components/shop/category-page"
import { getLocalizedText, getMockShopCategory } from "@/lib/shop/catalog"
import { buildShopMetadata } from "@/lib/shop/seo"
import type { ShopLocale } from "@/lib/shop/types"

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: ShopLocale; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const data = getMockShopCategory(locale, slug)

  if (!data) {
    return {}
  }

  return buildShopMetadata({
    locale,
    seo: data.category.seo,
    fallbackTitle: getLocalizedText(data.category.title, locale),
    fallbackDescription: getLocalizedText(data.category.description, locale),
  })
}

export default async function ShopCategoryRoute({
  params,
}: {
  params: Promise<{ locale: ShopLocale; slug: string }>
}) {
  const { locale, slug } = await params
  const data = getMockShopCategory(locale, slug)

  if (!data) {
    notFound()
  }

  return <CategoryPage locale={locale} category={data.category} products={data.products} />
}
```

- [ ] **Step 3: Run route checks**

Run:

```powershell
npm run test:shop
npm run build
```

Expected: shop tests pass and build completes successfully. If build fails in pre-existing unrelated files, record the failing file paths and command output before continuing.

- [ ] **Step 4: Commit category page**

Run:

```powershell
git add app/shop/[locale]/category components/shop/category-page.tsx
git commit -m "Add shop category page"
```

---

### Task 7: Product Page, Variant Selector, And Quantity Control

**Files:**
- Create: `app/shop/[locale]/product/[...slugs]/page.tsx`
- Create: `components/shop/product-page.tsx`
- Create: `components/shop/product-gallery.tsx`
- Create: `components/shop/product-purchase-panel.tsx`

- [ ] **Step 1: Add product gallery**

Create `components/shop/product-gallery.tsx`:

```tsx
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const displayImages = images.length > 0 ? images : ["/placeholder.jpg"]

  return (
    <div className="grid gap-3">
      <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        <img src={displayImages[0]} alt={title} className="h-full w-full object-cover" />
      </div>
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {displayImages.slice(1, 5).map((image) => (
            <div key={image} className="aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-100">
              <img src={image} alt={title} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add purchase panel client island**

Create `components/shop/product-purchase-panel.tsx`:

```tsx
"use client"

import { useMemo, useState } from "react"

import { useShopCart } from "@/components/shop/shop-cart-provider"
import { Button } from "@/components/ui/button"
import { formatShopPrice, getAvailabilityLabel, getLocalizedText, getMaxPurchasableQuantity } from "@/lib/shop/catalog"
import type { ShopItem, ShopLocale, ShopVariant } from "@/lib/shop/types"

export function ProductPurchasePanel({
  locale,
  item,
  selectedVariant,
}: {
  locale: ShopLocale
  item: ShopItem
  selectedVariant: ShopVariant
}) {
  const [variantId, setVariantId] = useState(selectedVariant.id)
  const [quantity, setQuantity] = useState(1)
  const { addLine } = useShopCart()
  const variant = useMemo(() => item.variants.find((entry) => entry.id === variantId) ?? selectedVariant, [
    item.variants,
    selectedVariant,
    variantId,
  ])
  const maxQuantity = getMaxPurchasableQuantity(variant)
  const canBuy = maxQuantity > 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold">{formatShopPrice(variant.salePrice ?? variant.price, locale)}</span>
        {variant.salePrice && (
          <span className="text-sm text-gray-400 line-through">{formatShopPrice(variant.price, locale)}</span>
        )}
      </div>
      <p className="mt-2 text-sm font-medium text-gray-600">{getAvailabilityLabel(variant, locale)}</p>

      <div className="mt-6">
        <label className="text-sm font-semibold">Variant</label>
        <div className="mt-3 grid gap-2">
          {item.variants.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => {
                setVariantId(entry.id)
                setQuantity(1)
              }}
              className={`rounded-md border px-3 py-2 text-left text-sm ${
                entry.id === variant.id ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 bg-white"
              }`}
            >
              {getLocalizedText(entry.title, locale)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <label className="text-sm font-semibold">Quantity</label>
        <input
          type="number"
          min={1}
          max={Math.max(1, maxQuantity)}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Math.min(Number(event.target.value), Math.max(1, maxQuantity))))}
          className="mt-2 h-10 w-24 rounded-md border border-gray-300 px-3"
          disabled={!canBuy}
        />
      </div>

      <Button
        className="mt-6 w-full"
        size="lg"
        disabled={!canBuy}
        onClick={() =>
          addLine(
            {
              itemId: item.id,
              variantId: variant.id,
              quantity,
              titleSnapshot: `${getLocalizedText(item.title, locale)} - ${getLocalizedText(variant.title, locale)}`,
              priceSnapshot: variant.salePrice ?? variant.price,
              currency: "CZK",
            },
            maxQuantity,
          )
        }
      >
        {canBuy ? "Add to cart" : "Out of stock"}
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Add product page component**

Create `components/shop/product-page.tsx`:

```tsx
import Link from "next/link"

import { ProductGallery } from "@/components/shop/product-gallery"
import { ProductCard } from "@/components/shop/product-card"
import { ProductPurchasePanel } from "@/components/shop/product-purchase-panel"
import { StructuredData } from "@/components/shop/structured-data"
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/shop/seo"
import { getLocalizedText } from "@/lib/shop/catalog"
import type { ShopItem, ShopLocale, ShopProductCardView, ShopVariant } from "@/lib/shop/types"

export function ProductPage({
  locale,
  item,
  selectedVariant,
  relatedItems,
}: {
  locale: ShopLocale
  item: ShopItem
  selectedVariant: ShopVariant
  relatedItems: ShopProductCardView[]
}) {
  const title = getLocalizedText(item.title, locale)
  const category = item.categories[0]
  const productJsonLd = buildProductJsonLd(item, selectedVariant, locale)
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Shop", url: `https://shop.devicehelp.cz/${locale}` },
    { name: getLocalizedText(category.title, locale), url: `https://shop.devicehelp.cz/${locale}/category/${category.slug}` },
    { name: title, url: item.seo.locales[locale]?.canonicalUrl ?? item.seo.canonicalUrl },
  ])

  return (
    <div className="bg-white text-gray-950">
      <StructuredData id="shop-product-jsonld" data={productJsonLd} />
      <StructuredData id="shop-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <div className="container px-4 py-8 md:px-6">
        <nav className="text-sm text-gray-500">
          <Link href={`/${locale}`} className="hover:text-gray-900">Shop</Link>
          <span className="mx-2">/</span>
          <Link href={`/${locale}/category/${category.slug}`} className="hover:text-gray-900">
            {getLocalizedText(category.title, locale)}
          </Link>
        </nav>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px]">
          <ProductGallery images={selectedVariant.images.length ? selectedVariant.images : item.images} title={title} />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
            <p className="mt-4 text-sm leading-7 text-gray-600">{getLocalizedText(item.description, locale)}</p>
            <div className="mt-8">
              <ProductPurchasePanel locale={locale} item={item} selectedVariant={selectedVariant} />
            </div>
          </div>
        </div>
        <section className="mt-12 border-t border-gray-200 pt-10">
          <h2 className="text-xl font-semibold">Product details</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600">{getLocalizedText(item.content, locale)}</p>
        </section>
        {relatedItems.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">Related products</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedItems.map((product) => (
                <ProductCard key={product.itemId} locale={locale} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add product route**

Create `app/shop/[locale]/product/[...slugs]/page.tsx`:

```tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ProductPage } from "@/components/shop/product-page"
import { getLocalizedText, getMockShopProduct } from "@/lib/shop/catalog"
import { buildShopMetadata } from "@/lib/shop/seo"
import type { ShopLocale } from "@/lib/shop/types"

export const revalidate = 3600

function parseSlugs(slugs: string[]) {
  return { itemSlug: slugs[0], variantSlug: slugs[1] }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: ShopLocale; slugs: string[] }>
}): Promise<Metadata> {
  const { locale, slugs } = await params
  const { itemSlug, variantSlug } = parseSlugs(slugs)
  const data = getMockShopProduct(locale, itemSlug, variantSlug)

  if (!data) {
    return {}
  }

  return buildShopMetadata({
    locale,
    seo: data.item.seo,
    fallbackTitle: getLocalizedText(data.item.title, locale),
    fallbackDescription: getLocalizedText(data.item.description, locale),
  })
}

export default async function ShopProductRoute({
  params,
}: {
  params: Promise<{ locale: ShopLocale; slugs: string[] }>
}) {
  const { locale, slugs } = await params
  const { itemSlug, variantSlug } = parseSlugs(slugs)
  const data = getMockShopProduct(locale, itemSlug, variantSlug)

  if (!data) {
    notFound()
  }

  return (
    <ProductPage
      locale={locale}
      item={data.item}
      selectedVariant={data.selectedVariant}
      relatedItems={data.relatedItems}
    />
  )
}
```

- [ ] **Step 5: Run product checks**

Run:

```powershell
npm run test:shop
npm run build
```

Expected: shop tests pass and build completes successfully. If build fails in pre-existing unrelated files, record the failing file paths and command output before continuing.

- [ ] **Step 6: Commit product page**

Run:

```powershell
git add app/shop/[locale]/product components/shop/product-gallery.tsx components/shop/product-page.tsx components/shop/product-purchase-panel.tsx
git commit -m "Add shop product page with variants"
```

---

### Task 8: Cart And Checkout Shell Routes

**Files:**
- Create: `app/shop/[locale]/cart/page.tsx`
- Create: `app/shop/[locale]/checkout/page.tsx`
- Create: `lib/shop/cart.ts`
- Create: `tests/shop-cart.test.mjs`

- [ ] **Step 1: Add cart reducer unit tests**

Create `tests/shop-cart.test.mjs`:

```js
import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import ts from "typescript"

const source = await readFile(new URL("../lib/shop/cart.ts", import.meta.url), "utf8")
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
})
const { createCartLine, addCartLine, setCartLineQuantity } = await import(
  `data:text/javascript;charset=utf-8,${encodeURIComponent(outputText)}`
)

test("creates variant cart line snapshots", () => {
  const line = createCartLine({
    itemId: "item-1",
    variantId: "variant-1",
    title: "Glass - iPhone 13",
    price: 249,
    quantity: 1,
  })

  assert.equal(line.variantId, "variant-1")
  assert.equal(line.currency, "CZK")
})

test("adds existing line without exceeding max quantity", () => {
  const line = createCartLine({
    itemId: "item-1",
    variantId: "variant-1",
    title: "Glass - iPhone 13",
    price: 249,
    quantity: 2,
  })
  const cart = addCartLine({ lines: [line] }, line, 3)
  assert.equal(cart.lines[0].quantity, 3)
})

test("sets quantity with max guard", () => {
  const line = createCartLine({
    itemId: "item-1",
    variantId: "variant-1",
    title: "Glass - iPhone 13",
    price: 249,
    quantity: 1,
  })
  const cart = setCartLineQuantity({ lines: [line] }, "variant-1", 8, 5)
  assert.equal(cart.lines[0].quantity, 5)
})
```

- [ ] **Step 2: Add cart utility functions**

Create `lib/shop/cart.ts`:

```ts
import type { ShopCurrency } from "./types"

export interface ShopCartLine {
  itemId: string
  variantId: string
  quantity: number
  titleSnapshot: string
  priceSnapshot: number
  currency: ShopCurrency
}

export interface ShopCart {
  lines: ShopCartLine[]
}

export function createCartLine({
  itemId,
  variantId,
  title,
  price,
  quantity,
}: {
  itemId: string
  variantId: string
  title: string
  price: number
  quantity: number
}): ShopCartLine {
  return {
    itemId,
    variantId,
    quantity,
    titleSnapshot: title,
    priceSnapshot: price,
    currency: "CZK",
  }
}

function clamp(quantity: number, maxQuantity: number): number {
  return Math.max(1, Math.min(quantity, maxQuantity))
}

export function addCartLine(cart: ShopCart, line: ShopCartLine, maxQuantity: number): ShopCart {
  const existing = cart.lines.find((entry) => entry.variantId === line.variantId)
  if (!existing) {
    return { lines: [...cart.lines, { ...line, quantity: clamp(line.quantity, maxQuantity) }] }
  }

  return {
    lines: cart.lines.map((entry) =>
      entry.variantId === line.variantId
        ? { ...entry, quantity: clamp(entry.quantity + line.quantity, maxQuantity) }
        : entry,
    ),
  }
}

export function setCartLineQuantity(
  cart: ShopCart,
  variantId: string,
  quantity: number,
  maxQuantity: number,
): ShopCart {
  return {
    lines: cart.lines.map((entry) =>
      entry.variantId === variantId ? { ...entry, quantity: clamp(quantity, maxQuantity) } : entry,
    ),
  }
}
```

- [ ] **Step 3: Add cart shell route**

Create `app/shop/[locale]/cart/page.tsx`:

```tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cart | DeviceHelp Shop",
  robots: "noindex,follow",
}

export default function ShopCartPage() {
  return (
    <div className="container px-4 py-12 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Cart</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">
        The local cart shell is prepared for product variant lines. Production checkout will connect to backend order reservations after the storefront pages are stable.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Add checkout shell route**

Create `app/shop/[locale]/checkout/page.tsx`:

```tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout | DeviceHelp Shop",
  robots: "noindex,follow",
}

export default function ShopCheckoutPage() {
  return (
    <div className="container px-4 py-12 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">
        Checkout is reserved for the future order reservation, Packeta, and payment flow. This route stays noindex.
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Run cart tests**

Run:

```powershell
node --test tests/shop-cart.test.mjs
npm run test:shop
npm run build
```

Expected: shop tests pass and build completes successfully. If build fails in pre-existing unrelated files, record the failing file paths and command output before continuing.

- [ ] **Step 6: Commit cart shell**

Run:

```powershell
git add app/shop/[locale]/cart app/shop/[locale]/checkout lib/shop/cart.ts tests/shop-cart.test.mjs
git commit -m "Add shop cart and checkout shells"
```

---

### Task 9: Verification And Browser QA

**Files:**
- Modify only if a failed verification exposes a defect in files from Tasks 1-8.

- [ ] **Step 1: Run focused shop tests**

Run:

```powershell
npm run test:shop
npm run test:b2b-routing
```

Expected: all tests pass.

- [ ] **Step 2: Run build**

Run:

```powershell
npm run build
```

Expected: build succeeds or reaches the same known baseline errors that existed before shop work. If the build fails because of new shop files, fix the shop issue before continuing.

- [ ] **Step 3: Start local dev server**

Run:

```powershell
npm run dev
```

Expected: Next dev server starts, usually at `http://localhost:3000`.

- [ ] **Step 4: Browser-check shop pages**

Open these URLs in the in-app browser:

```text
http://localhost:3000/shop/cs
http://localhost:3000/shop/cs/category/protection
http://localhost:3000/shop/cs/product/protective-glass
http://localhost:3000/shop/cs/product/protective-glass/protective-glass-iphone-11
http://localhost:3000/shop/cs/cart
http://localhost:3000/shop/cs/checkout
```

Expected:

- Header does not overlap content.
- Homepage first viewport has a clear retail offer.
- Category grid is readable on desktop and mobile.
- Product page shows gallery, price, variants, availability, and quantity.
- Out-of-stock variants disable add-to-cart if present in mock data.
- Cart count changes after add-to-cart.
- Cart and checkout routes are visually acceptable shells.

- [ ] **Step 5: Commit verification fixes**

If fixes were needed, run:

```powershell
git add app/shop components/shop lib/shop tests/shop-*.test.mjs middleware.ts lib/site-config.ts package.json messages/cs.json messages/uk.json messages/en.json
git commit -m "Fix shop storefront verification issues"
```

If no fixes were needed, do not create an empty commit.

---

## Final Acceptance Criteria

- `shop.devicehelp.cz/{locale}` rewrites to internal `/shop/{locale}` routes.
- Main domain and B2B routing behavior remain unchanged.
- Shop pages render from API-shaped mock data.
- Product pages use selected `variantId` and stock-aware quantity controls.
- Local cart shell stores product variant lines, not base item lines.
- Metadata and JSON-LD are generated from typed data.
- Non-checkout catalog pages are prepared for server-rendered SEO.
- Cart and checkout routes are noindex shells.
- Focused tests pass.
- Browser QA passes on desktop and mobile.
