# B2B Subdomain Microsite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a host-aware B2B microsite on `b2b.devicehelp.cz` with localized B2B home/FAQ pages, dedicated navigation, main-domain redirects for non-B2B routes, and company-account registration CTA behavior.

**Architecture:** Add pure routing helpers first, then wire them into middleware, layout/header mode, localized B2B pages, registration query handling, and host-aware SEO route handlers. Only B2B home and B2B FAQ stay indexable on the B2B subdomain; all catalog/auth/profile/admin paths on `b2b.` redirect to the main domain while preserving locale, path, and query string.

**Tech Stack:** Next.js 15 App Router, React 19, next-intl, Tailwind CSS, lucide-react, Node 24 built-in test runner.

---

## File Structure

- Create `lib/b2b-routing.ts`: pure host/path helpers used by middleware, layout, B2B links, sitemap, and tests.
- Create `tests/b2b-routing.test.ts`: Node test coverage for B2B host detection, allowlist, locale defaults, and redirect target generation.
- Modify `middleware.ts`: apply B2B allowlist and redirect all non-B2B paths on `b2b.` to `devicehelp.cz`.
- Modify `lib/site-config.ts`: add `b2bSiteUrl` and `mainSiteUrl` helpers while preserving existing `siteUrl`.
- Modify `app/[locale]/layout.tsx`: detect B2B host server-side and pass B2B mode into the header.
- Modify `components/header.tsx`: add B2B nav mode and main-domain links for non-B2B destinations.
- Modify `components/mobile-nav.tsx`: add B2B bottom-nav mode.
- Create `components/b2b/b2b-home-page.tsx`: localized B2B landing page sections.
- Create `components/b2b/b2b-faq-page.tsx`: localized B2B FAQ page.
- Modify `app/[locale]/page.tsx`: render B2B homepage on the B2B host, otherwise keep current homepage.
- Create `app/[locale]/faq/page.tsx`: render B2B FAQ only on the B2B host; `notFound()` on the main domain.
- Modify `messages/cs.json`, `messages/uk.json`, `messages/en.json`: add `B2B` and B2B header/auth copy.
- Modify `app/[locale]/auth/register/register-client.tsx`: preselect company/B2B checkbox when `?b2b=1` is present and update visible label.
- Create `lib/seo/sitemap-xml.ts`: XML helpers for sitemap route handler.
- Create `lib/seo/main-sitemap.ts`: move current dynamic main-domain sitemap generation here.
- Create `lib/seo/b2b-sitemap.ts`: return only localized B2B home and FAQ sitemap entries.
- Replace `app/sitemap.ts` with `app/sitemap.xml/route.ts`: host-aware sitemap response.
- Replace `app/robots.ts` with `app/robots.txt/route.ts`: host-aware robots response.
- Modify `package.json`: add a focused `test:b2b-routing` script.

---

### Task 1: Pure B2B Routing Helpers

**Files:**
- Create: `lib/b2b-routing.ts`
- Create: `tests/b2b-routing.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing routing tests**

Create `tests/b2b-routing.test.ts`:

```ts
import test from "node:test"
import assert from "node:assert/strict"

import {
  DEFAULT_LOCALE,
  getB2BRedirectTarget,
  getDefaultLocalizedB2BPath,
  isAllowedB2BPath,
  isB2BHost,
  stripHostPort,
} from "../lib/b2b-routing.ts"

test("uses Czech as the default B2B locale", () => {
  assert.equal(DEFAULT_LOCALE, "cs")
})

test("strips ports and lowercases hosts", () => {
  assert.equal(stripHostPort("B2B.DeviceHelp.cz:3000"), "b2b.devicehelp.cz")
  assert.equal(stripHostPort("devicehelp.cz"), "devicehelp.cz")
})

test("detects B2B hosts", () => {
  assert.equal(isB2BHost("b2b.devicehelp.cz"), true)
  assert.equal(isB2BHost("b2b.devicehelp.cz:3000"), true)
  assert.equal(isB2BHost("devicehelp.cz"), false)
  assert.equal(isB2BHost("www.devicehelp.cz"), false)
})

test("allows only localized B2B microsite paths", () => {
  assert.equal(isAllowedB2BPath("/"), true)
  assert.equal(isAllowedB2BPath("/cs"), true)
  assert.equal(isAllowedB2BPath("/uk"), true)
  assert.equal(isAllowedB2BPath("/en"), true)
  assert.equal(isAllowedB2BPath("/cs/faq"), true)
  assert.equal(isAllowedB2BPath("/uk/faq/"), true)
  assert.equal(isAllowedB2BPath("/en/brands"), false)
  assert.equal(isAllowedB2BPath("/cs/auth/register"), false)
})

test("builds default localized B2B path", () => {
  assert.equal(getDefaultLocalizedB2BPath("/"), "/cs")
  assert.equal(getDefaultLocalizedB2BPath("/brands/apple"), "/cs/brands/apple")
  assert.equal(getDefaultLocalizedB2BPath("/cs/brands/apple"), "/cs/brands/apple")
})

test("redirects B2B disallowed localized paths to the main domain", () => {
  const target = getB2BRedirectTarget({
    host: "b2b.devicehelp.cz",
    pathname: "/cs/brands/apple",
    search: "?from=ad",
    mainBaseUrl: "https://devicehelp.cz",
  })

  assert.equal(target?.toString(), "https://devicehelp.cz/cs/brands/apple?from=ad")
})

test("redirects B2B disallowed unlocalized paths to the main Czech path", () => {
  const target = getB2BRedirectTarget({
    host: "b2b.devicehelp.cz",
    pathname: "/brands/apple",
    search: "",
    mainBaseUrl: "https://devicehelp.cz",
  })

  assert.equal(target?.toString(), "https://devicehelp.cz/cs/brands/apple")
})

test("does not redirect allowed B2B paths or main-domain paths", () => {
  assert.equal(
    getB2BRedirectTarget({
      host: "b2b.devicehelp.cz",
      pathname: "/cs/faq",
      search: "",
      mainBaseUrl: "https://devicehelp.cz",
    }),
    null,
  )
  assert.equal(
    getB2BRedirectTarget({
      host: "devicehelp.cz",
      pathname: "/cs/brands/apple",
      search: "",
      mainBaseUrl: "https://devicehelp.cz",
    }),
    null,
  )
})
```

- [ ] **Step 2: Run the routing tests to verify they fail**

Run:

```bash
node --test tests/b2b-routing.test.ts
```

Expected: FAIL with `Cannot find module '../lib/b2b-routing.ts'`.

- [ ] **Step 3: Implement the routing helper**

Create `lib/b2b-routing.ts`:

```ts
export const SUPPORTED_LOCALES = ["cs", "uk", "en"] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = "cs"
export const B2B_SUBDOMAIN = "b2b"
export const B2B_ALLOWED_SUFFIXES = ["", "/faq"] as const

export function stripHostPort(host: string): string {
  return host.toLowerCase().split(":")[0] ?? ""
}

export function isB2BHost(host: string): boolean {
  const cleanHost = stripHostPort(host)
  return cleanHost === "b2b.devicehelp.cz" || cleanHost.startsWith(`${B2B_SUBDOMAIN}.`)
}

export function stripTrailingSlash(pathname: string): string {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1)
  }

  return pathname
}

export function getPathLocale(pathname: string): SupportedLocale | null {
  const firstSegment = pathname.split("/").filter(Boolean)[0]
  return SUPPORTED_LOCALES.includes(firstSegment as SupportedLocale) ? (firstSegment as SupportedLocale) : null
}

export function getDefaultLocalizedB2BPath(pathname: string): string {
  const normalizedPath = stripTrailingSlash(pathname)
  const locale = getPathLocale(normalizedPath)

  if (locale) {
    return normalizedPath || `/${DEFAULT_LOCALE}`
  }

  if (normalizedPath === "/") {
    return `/${DEFAULT_LOCALE}`
  }

  return `/${DEFAULT_LOCALE}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`
}

export function isAllowedB2BPath(pathname: string): boolean {
  const normalizedPath = stripTrailingSlash(pathname)

  if (normalizedPath === "/") {
    return true
  }

  const locale = getPathLocale(normalizedPath)
  if (!locale) {
    return false
  }

  const suffix = normalizedPath.replace(`/${locale}`, "") || ""
  return B2B_ALLOWED_SUFFIXES.includes(suffix as (typeof B2B_ALLOWED_SUFFIXES)[number])
}

export function getB2BRedirectTarget({
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
  if (!isB2BHost(host) || isAllowedB2BPath(pathname)) {
    return null
  }

  const targetPath = getDefaultLocalizedB2BPath(pathname)
  const target = new URL(targetPath, mainBaseUrl)
  target.search = search

  return target
}
```

- [ ] **Step 4: Add a focused test script**

Modify `package.json` scripts:

```json
"test:b2b-routing": "node --test tests/b2b-routing.test.ts"
```

Keep the existing `build`, `dev`, `lint`, and `start` scripts unchanged.

- [ ] **Step 5: Run the routing tests to verify they pass**

Run:

```bash
npm run test:b2b-routing
```

Expected: PASS with 8 passing tests.

- [ ] **Step 6: Commit routing helpers**

```bash
git add lib/b2b-routing.ts tests/b2b-routing.test.ts package.json package-lock.json
git commit -m "feat: add b2b routing helpers"
```

---

### Task 2: Middleware B2B Redirect Rules

**Files:**
- Modify: `middleware.ts`
- Test: `tests/b2b-routing.test.ts`

- [ ] **Step 1: Add a failing test for auth and query redirects**

Append to `tests/b2b-routing.test.ts`:

```ts
test("redirects B2B auth registration to the main domain with query string", () => {
  const target = getB2BRedirectTarget({
    host: "b2b.devicehelp.cz",
    pathname: "/cs/auth/register",
    search: "?b2b=1",
    mainBaseUrl: "https://devicehelp.cz",
  })

  assert.equal(target?.toString(), "https://devicehelp.cz/cs/auth/register?b2b=1")
})
```

- [ ] **Step 2: Run the focused test to verify the behavior is covered**

Run:

```bash
npm run test:b2b-routing
```

Expected: PASS if Task 1 already handles this case. If it fails, fix `getB2BRedirectTarget` before touching middleware.

- [ ] **Step 3: Import helper and site URL in middleware**

At the top of `middleware.ts`, add:

```ts
import { getB2BRedirectTarget } from "@/lib/b2b-routing"
import { siteUrl } from "@/lib/site-config"
```

- [ ] **Step 4: Apply B2B redirect before locale/cookie/auth logic**

Inside `middleware()`, after the static/API skip block and after `hostname` is available, insert:

```ts
  const b2bRedirectTarget = getB2BRedirectTarget({
    host: hostname,
    pathname,
    search: request.nextUrl.search,
    mainBaseUrl: siteUrl,
  })

  if (b2bRedirectTarget) {
    return NextResponse.redirect(b2bRedirectTarget, { status: 308 })
  }
```

Keep the existing HTTPS redirect, `www` cleanup, locale redirect, cookie setting, auth checks, and maintenance mode behavior in place.

- [ ] **Step 5: Run routing tests**

Run:

```bash
npm run test:b2b-routing
```

Expected: PASS.

- [ ] **Step 6: Commit middleware redirect rules**

```bash
git add middleware.ts tests/b2b-routing.test.ts
git commit -m "feat: redirect non-b2b subdomain routes"
```

---

### Task 3: Site URL Helpers

**Files:**
- Modify: `lib/site-config.ts`
- Test: `tests/b2b-routing.test.ts`

- [ ] **Step 1: Run focused routing tests before changing config**

Run:

```bash
npm run test:b2b-routing
```

Expected: PASS. This confirms the routing helper baseline before adding URL exports.

- [ ] **Step 2: Extend site config**

Modify `lib/site-config.ts` to:

```ts
/**
 * Shared site URL config - reads NEXT_PUBLIC_SITE_URL at runtime.
 *
 * On production set: NEXT_PUBLIC_SITE_URL=https://devicehelp.cz
 * On staging set:    NEXT_PUBLIC_SITE_URL=https://test2.mobil-brevnov.cz
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://devicehelp.cz"

export const mainSiteUrl = siteUrl

export const b2bSiteUrl =
  process.env.NEXT_PUBLIC_B2B_SITE_URL?.replace(/\/$/, "") ?? "https://b2b.devicehelp.cz"
```

- [ ] **Step 3: Run focused routing tests**

Run:

```bash
npm run test:b2b-routing
```

Expected: PASS.

- [ ] **Step 4: Commit URL config**

```bash
git add lib/site-config.ts
git commit -m "feat: add b2b site url config"
```

---

### Task 4: Dedicated B2B Header And Mobile Nav

**Files:**
- Modify: `app/[locale]/layout.tsx`
- Modify: `components/header.tsx`
- Modify: `components/mobile-nav.tsx`
- Modify: `messages/cs.json`
- Modify: `messages/uk.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add translation keys first**

Add these keys under each `Header` namespace.

`messages/cs.json`:

```json
"b2bHome": "Firemní servis",
"b2bHowItWorks": "Jak to funguje",
"b2bBenefits": "Výhody",
"b2bFaq": "FAQ",
"businessAccount": "Firemní účet",
"registerBusinessAccount": "Registrovat firemní účet"
```

`messages/uk.json`:

```json
"b2bHome": "Для компаній",
"b2bHowItWorks": "Як це працює",
"b2bBenefits": "Переваги",
"b2bFaq": "FAQ",
"businessAccount": "Акаунт компанії",
"registerBusinessAccount": "Зареєструвати акаунт для компанії"
```

`messages/en.json`:

```json
"b2bHome": "Business service",
"b2bHowItWorks": "How it works",
"b2bBenefits": "Benefits",
"b2bFaq": "FAQ",
"businessAccount": "Business account",
"registerBusinessAccount": "Register a business account"
```

- [ ] **Step 2: Add props to `Header`**

In `components/header.tsx`, change the function signature to:

```ts
interface HeaderProps {
  variant?: "default" | "b2b"
  mainDomainBaseUrl?: string
}

export function Header({ variant = "default", mainDomainBaseUrl = "" }: HeaderProps) {
```

- [ ] **Step 3: Add B2B navigation arrays**

In `components/header.tsx`, replace the current `navigation` constant with:

```tsx
  const defaultNavigation = [
    { name: t("home"), href: `/${locale}`, icon: <Home className="h-5 w-5" /> },
    { name: t("chooseModel"), href: `/${locale}/brands`, icon: <Smartphone className="h-5 w-5" /> },
    { name: t("articles"), href: `/${locale}/articles`, icon: <Wrench className="h-5 w-5" /> },
    { name: t("contact"), href: `/${locale}/contact`, icon: <MessageSquare className="h-5 w-5" /> },
  ]

  const mainDomain = mainDomainBaseUrl.replace(/\/$/, "")
  const b2bNavigation = [
    { name: t("b2bHome"), href: `/${locale}`, icon: <Building2 className="h-5 w-5" /> },
    { name: t("b2bHowItWorks"), href: `/${locale}#how-it-works`, icon: <Layers className="h-5 w-5" /> },
    { name: t("b2bBenefits"), href: `/${locale}#benefits`, icon: <Wrench className="h-5 w-5" /> },
    { name: t("b2bFaq"), href: `/${locale}/faq`, icon: <MessageSquare className="h-5 w-5" /> },
    { name: t("chooseModel"), href: `${mainDomain}/${locale}/brands`, icon: <Smartphone className="h-5 w-5" /> },
  ]

  const navigation = variant === "b2b" ? b2bNavigation : defaultNavigation
```

- [ ] **Step 4: Add B2B badge near logo**

Inside the logo link in `components/header.tsx`, after `<span className="font-semibold md:truncate-none truncate">DeviceHelp</span>`, add:

```tsx
              {variant === "b2b" && (
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {t("businessAccount")}
                </span>
              )}
```

- [ ] **Step 5: Add primary desktop CTA in Header**

In the right-side header controls before `LanguageSwitcher`, add:

```tsx
            {variant === "b2b" && (
              <Button asChild size="sm" className="hidden lg:inline-flex">
                <Link href={`${mainDomain}/${locale}/auth/register?b2b=1`}>
                  {t("registerBusinessAccount")}
                </Link>
              </Button>
            )}
```

- [ ] **Step 6: Pass B2B mode to mobile nav**

At the end of `components/header.tsx`, replace:

```tsx
      <MobileNav />
```

with:

```tsx
      <MobileNav variant={variant} mainDomainBaseUrl={mainDomainBaseUrl} />
```

- [ ] **Step 7: Add B2B props to `MobileNav`**

In `components/mobile-nav.tsx`, add:

```ts
interface MobileNavProps {
  variant?: "default" | "b2b"
  mainDomainBaseUrl?: string
}

export function MobileNav({ variant = "default", mainDomainBaseUrl = "" }: MobileNavProps) {
```

Then replace the `navigation` array with:

```tsx
  const mainDomain = mainDomainBaseUrl.replace(/\/$/, "")
  const defaultNavigation = [
    {
      name: t("Header.home"),
      href: `/${locale}`,
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: t("Header.chooseModel"),
      href: `/${locale}/brands`,
      icon: <Smartphone className="h-5 w-5" />,
    },
    {
      name: t("Header.articles"),
      href: `/${locale}/articles`,
      icon: <Wrench className="h-5 w-5" />,
    },
    {
      name: t("Header.contact"),
      href: `/${locale}/contact`,
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ]

  const b2bNavigation = [
    {
      name: t("Header.b2bHome"),
      href: `/${locale}`,
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: t("Header.b2bBenefits"),
      href: `/${locale}#benefits`,
      icon: <Wrench className="h-5 w-5" />,
    },
    {
      name: t("Header.b2bFaq"),
      href: `/${locale}/faq`,
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      name: t("Header.businessAccount"),
      href: `${mainDomain}/${locale}/auth/register?b2b=1`,
      icon: <Smartphone className="h-5 w-5" />,
    },
  ]

  const navigation = variant === "b2b" ? b2bNavigation : defaultNavigation
```

- [ ] **Step 8: Detect host in locale layout**

In `app/[locale]/layout.tsx`, import:

```ts
import { headers } from "next/headers"
import { isB2BHost } from "@/lib/b2b-routing"
import { mainSiteUrl } from "@/lib/site-config"
```

Inside `LocaleLayout`, after loading `locale`, add:

```ts
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""
  const isB2B = isB2BHost(host)
```

Replace:

```tsx
                    <Header />
```

with:

```tsx
                    <Header variant={isB2B ? "b2b" : "default"} mainDomainBaseUrl={mainSiteUrl} />
```

- [ ] **Step 9: Run build for type checking**

Run:

```bash
npm run build
```

Expected: build completes. If unrelated existing project warnings appear, record them and continue only if the build exits 0.

- [ ] **Step 10: Commit B2B navigation**

```bash
git add -- "app/[locale]/layout.tsx" components/header.tsx components/mobile-nav.tsx messages/cs.json messages/uk.json messages/en.json
git commit -m "feat: add b2b navigation mode"
```

---

### Task 5: Localized B2B Home Page

**Files:**
- Create: `components/b2b/b2b-home-page.tsx`
- Modify: `app/[locale]/page.tsx`
- Modify: `messages/cs.json`
- Modify: `messages/uk.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add B2B home translations**

Add a new top-level `B2B` namespace to each messages file.

Use this Czech content in `messages/cs.json`:

```json
"B2B": {
  "home": {
    "eyebrow": "Firemní servis mobilních telefonů",
    "title": "Servis mobilních telefonů pro firmy a podnikatele",
    "subtitle": "Opravujeme firemní telefony pro firmy, OSVČ, kanceláře a organizace v Praze. Jasná komunikace, záruka a registrace firemního účtu.",
    "primaryCta": "Registrovat firemní účet",
    "secondaryCta": "Kontaktovat servis",
    "trust1": "Pro firmy a OSVČ",
    "trust2": "IČO / DIČ v registraci",
    "trust3": "Záruka na opravy",
    "audienceTitle": "Pro koho je firemní spolupráce",
    "audienceSubtitle": "Praktické řešení pro týmy, které potřebují mít pracovní telefony rychle zpět v provozu.",
    "audiences": [
      "Firmy se služebními telefony",
      "OSVČ a menší podnikatelé",
      "Kanceláře a malé týmy",
      "Organizace s opakovanými opravami"
    ],
    "benefitsTitle": "Výhody firemního servisu",
    "benefits": [
      "Firemní účet s údaji společnosti",
      "Registrace přes IČO a DIČ",
      "Schválení účtu administrátorem",
      "Jasná komunikace o opravách",
      "Záruka na provedený servis",
      "Možnost rychle vyhledat model a službu"
    ],
    "processTitle": "Jak spolupráce funguje",
    "process": [
      "Zaregistrujete firemní účet",
      "Vyplníte kontaktní a firemní údaje",
      "Potvrdíte e-mail",
      "Po schválení účtu můžeme řešit opravy firemních zařízení"
    ],
    "contactTitle": "Chcete se nejdřív domluvit?",
    "contactText": "Napište nám nebo zavolejte. Pomůžeme vybrat nejvhodnější postup pro vaši firmu.",
    "finalTitle": "Začněte firemní spolupráci s DeviceHelp",
    "finalText": "Registrace firemního účtu zabere jen chvíli. Po kontrole údajů vás budeme informovat o aktivaci."
  },
  "faq": {
    "metadataTitle": "FAQ firemního servisu | DeviceHelp",
    "metadataDescription": "Časté otázky k firemnímu servisu mobilních telefonů DeviceHelp pro firmy, OSVČ a organizace.",
    "title": "Časté otázky k firemnímu servisu",
    "subtitle": "Krátké odpovědi k registraci, schválení účtu a opravám firemních zařízení."
  }
}
```

Use this Ukrainian content in `messages/uk.json`:

```json
"B2B": {
  "home": {
    "eyebrow": "Сервіс мобільних телефонів для компаній",
    "title": "Ремонт мобільних телефонів для компаній і підприємців",
    "subtitle": "Ремонтуємо службові телефони для компаній, підприємців, офісів та організацій у Празі. Зрозуміла комунікація, гарантія та реєстрація акаунта для компанії.",
    "primaryCta": "Зареєструвати акаунт для компанії",
    "secondaryCta": "Зв'язатися із сервісом",
    "trust1": "Для компаній і підприємців",
    "trust2": "IČO / DIČ у реєстрації",
    "trust3": "Гарантія на ремонти",
    "audienceTitle": "Для кого підходить співпраця",
    "audienceSubtitle": "Практичне рішення для команд, яким потрібно швидко повернути робочі телефони в користування.",
    "audiences": [
      "Компанії зі службовими телефонами",
      "Підприємці та малі бізнеси",
      "Офіси та невеликі команди",
      "Організації з повторними ремонтами"
    ],
    "benefitsTitle": "Переваги сервісу для компаній",
    "benefits": [
      "Акаунт компанії з реквізитами",
      "Реєстрація через IČO та DIČ",
      "Підтвердження акаунта адміністратором",
      "Зрозуміла комунікація щодо ремонтів",
      "Гарантія на виконаний сервіс",
      "Можливість швидко знайти модель і послугу"
    ],
    "processTitle": "Як працює співпраця",
    "process": [
      "Ви реєструєте акаунт для компанії",
      "Заповнюєте контактні та фірмові дані",
      "Підтверджуєте email",
      "Після підтвердження акаунта ми можемо обробляти ремонти робочих пристроїв"
    ],
    "contactTitle": "Хочете спочатку домовитися?",
    "contactText": "Напишіть нам або зателефонуйте. Допоможемо підібрати найзручніший процес для вашої компанії.",
    "finalTitle": "Почніть співпрацю з DeviceHelp для компанії",
    "finalText": "Реєстрація акаунта для компанії займає лише кілька хвилин. Після перевірки даних ми повідомимо вас про активацію."
  },
  "faq": {
    "metadataTitle": "FAQ сервісу для компаній | DeviceHelp",
    "metadataDescription": "Часті питання про ремонт мобільних телефонів DeviceHelp для компаній, підприємців та організацій.",
    "title": "Часті питання про сервіс для компаній",
    "subtitle": "Короткі відповіді про реєстрацію, підтвердження акаунта та ремонт робочих пристроїв."
  }
}
```

Use this English content in `messages/en.json`:

```json
"B2B": {
  "home": {
    "eyebrow": "Company mobile phone service",
    "title": "Mobile phone repair for companies and entrepreneurs",
    "subtitle": "We repair company phones for businesses, entrepreneurs, offices, and organizations in Prague. Clear communication, warranty, and business account registration.",
    "primaryCta": "Register a business account",
    "secondaryCta": "Contact service",
    "trust1": "For companies and entrepreneurs",
    "trust2": "Company details in registration",
    "trust3": "Warranty on repairs",
    "audienceTitle": "Who the company service is for",
    "audienceSubtitle": "A practical option for teams that need work phones back in use quickly.",
    "audiences": [
      "Companies with employee phones",
      "Entrepreneurs and small businesses",
      "Offices and small teams",
      "Organizations with recurring repairs"
    ],
    "benefitsTitle": "Benefits of company service",
    "benefits": [
      "Business account with company details",
      "Registration with company identifiers",
      "Account approval by an administrator",
      "Clear repair communication",
      "Warranty on completed service",
      "Fast model and service lookup"
    ],
    "processTitle": "How cooperation works",
    "process": [
      "Register a business account",
      "Fill in contact and company details",
      "Confirm your email",
      "After account approval, we can handle repairs for company devices"
    ],
    "contactTitle": "Want to talk first?",
    "contactText": "Write to us or call us. We will help choose the best process for your company.",
    "finalTitle": "Start company cooperation with DeviceHelp",
    "finalText": "Business account registration takes only a few minutes. After checking your details, we will inform you about activation."
  },
  "faq": {
    "metadataTitle": "Company service FAQ | DeviceHelp",
    "metadataDescription": "Frequently asked questions about DeviceHelp mobile phone repair for companies, entrepreneurs, and organizations.",
    "title": "Company service FAQ",
    "subtitle": "Short answers about registration, account approval, and repairs for company devices."
  }
}
```

- [ ] **Step 2: Create the B2B home component**

Create `components/b2b/b2b-home-page.tsx`:

```tsx
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowRight, Building2, CheckCircle2, Mail, Phone, ShieldCheck, Users, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { mainSiteUrl } from "@/lib/site-config"

interface B2BHomePageProps {
  locale: string
}

export async function B2BHomePage({ locale }: B2BHomePageProps) {
  const t = await getTranslations({ locale, namespace: "B2B.home" })
  const audiences = t.raw("audiences") as string[]
  const benefits = t.raw("benefits") as string[]
  const process = t.raw("process") as string[]
  const registerHref = `${mainSiteUrl}/${locale}/auth/register?b2b=1`

  return (
    <div className="bg-white">
      <section className="border-b bg-slate-50">
        <div className="container grid gap-10 px-4 py-12 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-20">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Building2 className="h-4 w-4" />
              {t("eyebrow")}
            </div>
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-gray-950 md:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href={registerHref}>
                  {t("primaryCta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#contact">{t("secondaryCta")}</a>
              </Button>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-gray-700 sm:grid-cols-3">
              {[t("trust1"), t("trust2"), t("trust3")].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="grid content-center gap-3">
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <Wrench className="mb-4 h-8 w-8 text-primary" />
              <h2 className="text-lg font-semibold text-gray-950">{t("audienceTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{t("audienceSubtitle")}</p>
              <div className="mt-5 grid gap-2">
                {audiences.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">{t("benefitsTitle")}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="rounded-lg border bg-white p-5">
                <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y bg-gray-50 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">{t("processTitle")}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {process.map((step, index) => (
              <div key={step} className="rounded-lg bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-12 md:py-16">
        <div className="container grid gap-8 px-4 md:grid-cols-[1fr_auto] md:px-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">{t("contactTitle")}</h2>
            <p className="mt-3 max-w-2xl text-gray-600">{t("contactText")}</p>
          </div>
          <div className="grid gap-3 text-sm">
            <a className="flex items-center gap-2 font-medium hover:text-primary" href="tel:+420775848259">
              <Phone className="h-4 w-4 text-primary" />
              +420 775 848 259
            </a>
            <a className="flex items-center gap-2 font-medium hover:text-primary" href="mailto:info@devicehelp.cz">
              <Mail className="h-4 w-4 text-primary" />
              info@devicehelp.cz
            </a>
          </div>
        </div>
      </section>

      <section className="border-t bg-slate-950 py-12 text-white md:py-16">
        <div className="container flex flex-col items-start justify-between gap-6 px-4 md:flex-row md:items-center md:px-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t("finalTitle")}</h2>
            <p className="mt-3 max-w-2xl text-slate-300">{t("finalText")}</p>
          </div>
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link href={registerHref}>
              {t("primaryCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Render B2B home based on host**

In `app/[locale]/page.tsx`, import:

```ts
import { headers } from "next/headers"
import { B2BHomePage } from "@/components/b2b/b2b-home-page"
import { isB2BHost } from "@/lib/b2b-routing"
import { b2bSiteUrl } from "@/lib/site-config"
```

Change `HomePage` to accept params and branch before loading consumer data:

```tsx
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""

  if (isB2BHost(host)) {
    return <B2BHomePage locale={locale} />
  }

  const brandsPromise = getBrands()
  const googleReviewsPromise = getGoogleReviews()

  return (
    <>
      <HeroSection />
      <Suspense fallback={null}>
        <GoogleReviewsAsync promise={googleReviewsPromise} />
      </Suspense>
      <Suspense fallback={null}>
        <BrandsSectionAsync promise={brandsPromise} />
      </Suspense>
      <Suspense fallback={null}>
        <ContactSection />
      </Suspense>
    </>
  )
}
```

In `generateMetadata`, add this B2B branch after reading `locale` and before the existing consumer SEO return:

```ts
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""

  if (isB2BHost(host)) {
    const b2bSeoData = {
      cs: {
        title: "B2B servis mobilních telefonů pro firmy | DeviceHelp",
        description:
          "Opravy firemních mobilních telefonů pro firmy, OSVČ a organizace v Praze. Registrace firemního účtu, záruka a jasná komunikace.",
      },
      uk: {
        title: "Ремонт мобільних телефонів для компаній | DeviceHelp",
        description:
          "Ремонт службових мобільних телефонів для компаній, підприємців та організацій у Празі. Реєстрація акаунта для компанії, гарантія та зрозуміла комунікація.",
      },
      en: {
        title: "Mobile Phone Repair for Companies | DeviceHelp",
        description:
          "Company mobile phone repairs for businesses, entrepreneurs, and organizations in Prague. Business account registration, warranty, and clear communication.",
      },
    }

    const currentSeo = b2bSeoData[locale as keyof typeof b2bSeoData] || b2bSeoData.cs
    const canonicalUrl = `${b2bSiteUrl}/${locale}`

    return {
      title: currentSeo.title,
      description: currentSeo.description,
      metadataBase: new URL(b2bSiteUrl),
      alternates: {
        canonical: canonicalUrl,
        languages: {
          cs: `${b2bSiteUrl}/cs`,
          uk: `${b2bSiteUrl}/uk`,
          en: `${b2bSiteUrl}/en`,
          "x-default": `${b2bSiteUrl}/cs`,
        },
      },
      openGraph: {
        title: currentSeo.title,
        description: currentSeo.description,
        url: canonicalUrl,
        siteName: "DeviceHelp",
        locale: toOGLocale(locale),
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: currentSeo.title,
        description: currentSeo.description,
      },
    }
  }
```

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: build exits 0.

- [ ] **Step 5: Commit B2B home**

```bash
git add -- "app/[locale]/page.tsx" components/b2b/b2b-home-page.tsx messages/cs.json messages/uk.json messages/en.json
git commit -m "feat: add localized b2b home page"
```

---

### Task 6: B2B FAQ Page

**Files:**
- Create: `components/b2b/b2b-faq-page.tsx`
- Create: `app/[locale]/faq/page.tsx`
- Modify: `messages/cs.json`
- Modify: `messages/uk.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add FAQ translations**

Under `B2B.faq`, add an `items` array in each locale. Czech:

```json
"items": [
  {
    "question": "Může se registrovat i OSVČ nebo malý podnikatel?",
    "answer": "Ano. Firemní účet je vhodný pro firmy, OSVČ i menší týmy, které potřebují řešit pracovní zařízení."
  },
  {
    "question": "Můžeme se registrovat i s jedním telefonem?",
    "answer": "Ano. Registrace není jen pro velké firmy. Dává smysl i tehdy, když chcete mít firemní údaje a komunikaci odděleně od běžných zakázek."
  },
  {
    "question": "Co se stane po registraci?",
    "answer": "Po potvrzení e-mailu zkontrolujeme firemní údaje. Po schválení vás informujeme e-mailem."
  },
  {
    "question": "Je na opravy záruka?",
    "answer": "Ano. Na provedené opravy poskytujeme záruku podle typu služby a použitých dílů."
  },
  {
    "question": "Můžeme se nejdřív domluvit bez registrace?",
    "answer": "Ano. Můžete nám zavolat nebo napsat e-mail a domluvit se na nejvhodnějším postupu."
  }
]
```

Use this Ukrainian `items` array:

```json
"items": [
  {
    "question": "Чи може зареєструватися підприємець або малий бізнес?",
    "answer": "Так. Акаунт для компанії підходить для фірм, підприємців і невеликих команд, яким потрібно ремонтувати робочі пристрої."
  },
  {
    "question": "Чи можна зареєструватися, якщо в компанії лише один телефон?",
    "answer": "Так. Реєстрація має сенс навіть для одного пристрою, якщо ви хочете відокремити фірмові дані та комунікацію від звичайних замовлень."
  },
  {
    "question": "Що відбувається після реєстрації?",
    "answer": "Після підтвердження email ми перевіримо фірмові дані. Після схвалення повідомимо вас електронною поштою."
  },
  {
    "question": "Чи є гарантія на ремонти?",
    "answer": "Так. На виконані ремонти надається гарантія залежно від типу послуги та використаних деталей."
  },
  {
    "question": "Чи можна спочатку домовитися без реєстрації?",
    "answer": "Так. Ви можете зателефонувати або написати нам на email, і ми підкажемо найзручніший варіант співпраці."
  }
]
```

Use this English `items` array:

```json
"items": [
  {
    "question": "Can an entrepreneur or small business register?",
    "answer": "Yes. A business account is suitable for companies, entrepreneurs, and small teams that need to repair work devices."
  },
  {
    "question": "Can a company register with only one phone?",
    "answer": "Yes. Registration can still make sense for one device if you want company details and communication separated from regular consumer orders."
  },
  {
    "question": "What happens after registration?",
    "answer": "After email confirmation, we check the company details. Once approved, we notify you by email."
  },
  {
    "question": "Are repairs covered by warranty?",
    "answer": "Yes. Completed repairs include warranty depending on the service type and parts used."
  },
  {
    "question": "Can we talk before registering?",
    "answer": "Yes. You can call us or email us first, and we will help choose the most convenient cooperation process."
  }
]
```

- [ ] **Step 2: Create FAQ component**

Create `components/b2b/b2b-faq-page.tsx`:

```tsx
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { mainSiteUrl } from "@/lib/site-config"

interface B2BFAQPageProps {
  locale: string
}

interface FAQItem {
  question: string
  answer: string
}

export async function B2BFAQPage({ locale }: B2BFAQPageProps) {
  const t = await getTranslations({ locale, namespace: "B2B.faq" })
  const home = await getTranslations({ locale, namespace: "B2B.home" })
  const items = t.raw("items") as FAQItem[]

  return (
    <div className="bg-white">
      <section className="border-b bg-slate-50 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-gray-950 md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-2xl text-gray-600 md:text-lg">{t("subtitle")}</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container grid gap-4 px-4 md:px-6">
          {items.map((item) => (
            <article key={item.question} className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-950">{item.question}</h2>
              <p className="mt-2 leading-7 text-gray-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t bg-slate-950 py-12 text-white">
        <div className="container flex flex-col gap-5 px-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <h2 className="text-2xl font-bold">{home("finalTitle")}</h2>
            <p className="mt-2 max-w-2xl text-slate-300">{home("finalText")}</p>
          </div>
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link href={`${mainSiteUrl}/${locale}/auth/register?b2b=1`}>
              {home("primaryCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Create FAQ route with host gate**

Create `app/[locale]/faq/page.tsx`:

```tsx
import type { Metadata } from "next"
import { headers } from "next/headers"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"

import { B2BFAQPage } from "@/components/b2b/b2b-faq-page"
import { isB2BHost } from "@/lib/b2b-routing"
import { b2bSiteUrl } from "@/lib/site-config"
import { toOGLocale } from "@/lib/og-locale"

interface FAQPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: FAQPageProps): Promise<Metadata> {
  const { locale } = await params
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""

  if (!isB2BHost(host)) {
    return { robots: { index: false, follow: false } }
  }

  const t = await getTranslations({ locale, namespace: "B2B.faq" })
  const canonicalUrl = `${b2bSiteUrl}/${locale}/faq`

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    metadataBase: new URL(b2bSiteUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        cs: `${b2bSiteUrl}/cs/faq`,
        uk: `${b2bSiteUrl}/uk/faq`,
        en: `${b2bSiteUrl}/en/faq`,
        "x-default": `${b2bSiteUrl}/cs/faq`,
      },
    },
    openGraph: {
      title: t("metadataTitle"),
      description: t("metadataDescription"),
      url: canonicalUrl,
      siteName: "DeviceHelp",
      locale: toOGLocale(locale),
      type: "website",
    },
  }
}

export default async function FAQPage({ params }: FAQPageProps) {
  const { locale } = await params
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""

  if (!isB2BHost(host)) {
    notFound()
  }

  return <B2BFAQPage locale={locale} />
}
```

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: build exits 0.

- [ ] **Step 5: Commit FAQ page**

```bash
git add -- "app/[locale]/faq/page.tsx" components/b2b/b2b-faq-page.tsx messages/cs.json messages/uk.json messages/en.json
git commit -m "feat: add b2b faq page"
```

---

### Task 7: Company Registration Query Preselect

**Files:**
- Modify: `app/[locale]/auth/register/register-client.tsx`
- Modify: `messages/cs.json`
- Modify: `messages/uk.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add Auth label translations**

Under `Auth`, add:

`messages/cs.json`:

```json
"businessClient": "Firemní účet / podnikatel"
```

`messages/uk.json`:

```json
"businessClient": "Акаунт для компанії / підприємця"
```

`messages/en.json`:

```json
"businessClient": "Business account / entrepreneur"
```

- [ ] **Step 2: Read `?b2b=1` in register client**

In `app/[locale]/auth/register/register-client.tsx`, import:

```ts
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
```

Replace the existing imports from `react` and `next/navigation` so there are no duplicate imports.

Inside `RegisterClient`, add:

```ts
  const searchParams = useSearchParams()
  const isBusinessRegistration = searchParams.get("b2b") === "1"
```

Set the `isB2B` default value:

```ts
      isB2B: isBusinessRegistration,
```

After `const watchIsB2B = initialForm.watch("isB2B")`, add:

```ts
  useEffect(() => {
    if (isBusinessRegistration) {
      initialForm.setValue("isB2B", true, { shouldDirty: false, shouldValidate: false })
    }
  }, [initialForm, isBusinessRegistration])
```

- [ ] **Step 3: Update visible checkbox label**

Replace:

```tsx
                {t("b2bClient") || "B2B Klient"}
```

with:

```tsx
                {t("businessClient") || t("b2bClient") || "Firemní účet / podnikatel"}
```

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: build exits 0.

- [ ] **Step 5: Commit registration preselect**

```bash
git add -- "app/[locale]/auth/register/register-client.tsx" messages/cs.json messages/uk.json messages/en.json
git commit -m "feat: preselect business registration"
```

---

### Task 8: Host-Aware Sitemap And Robots

**Files:**
- Create: `lib/seo/sitemap-xml.ts`
- Create: `lib/seo/b2b-sitemap.ts`
- Create: `lib/seo/main-sitemap.ts`
- Create: `app/sitemap.xml/route.ts`
- Create: `app/robots.txt/route.ts`
- Delete: `app/sitemap.ts`
- Delete: `app/robots.ts`

- [ ] **Step 1: Create sitemap XML helper**

Create `lib/seo/sitemap-xml.ts`:

```ts
export interface SitemapEntry {
  url: string
  lastModified?: Date
  alternates?: Record<string, string>
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function createSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastModified = entry.lastModified ?? new Date()
      const alternates = Object.entries(entry.alternates ?? {})
        .map(
          ([locale, href]) =>
            `<xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(href)}" />`,
        )
        .join("")

      return `<url><loc>${escapeXml(entry.url)}</loc><lastmod>${lastModified.toISOString()}</lastmod>${alternates}</url>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`
}
```

- [ ] **Step 2: Create B2B sitemap entries**

Create `lib/seo/b2b-sitemap.ts`:

```ts
import { b2bSiteUrl } from "@/lib/site-config"
import type { SitemapEntry } from "@/lib/seo/sitemap-xml"

const locales = ["cs", "uk", "en"] as const

export function getB2BSitemapEntries(): SitemapEntry[] {
  const now = new Date()
  const paths = ["", "/faq"] as const

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${b2bSiteUrl}/${locale}${path}`,
      lastModified: now,
      alternates: {
        cs: `${b2bSiteUrl}/cs${path}`,
        uk: `${b2bSiteUrl}/uk${path}`,
        en: `${b2bSiteUrl}/en${path}`,
        "x-default": `${b2bSiteUrl}/cs${path}`,
      },
    })),
  )
}
```

- [ ] **Step 3: Move existing main sitemap logic**

Create `lib/seo/main-sitemap.ts` by moving the existing logic from `app/sitemap.ts` into:

```ts
import { createServerClient } from "@/utils/supabase/server"
import { mainSiteUrl } from "@/lib/site-config"
import type { SitemapEntry } from "@/lib/seo/sitemap-xml"

export async function getMainSitemapEntries(): Promise<SitemapEntry[]> {
  const baseUrl = mainSiteUrl
  const locales = ["uk", "cs", "en"] as const
  const defaultLocale = "uk"
  const supabase = await createServerClient()
  const sitemapEntries: SitemapEntry[] = []

  function addMultilingualEntries(path: string, lastModified?: Date) {
    locales.forEach((locale) => {
      const alternates: Record<string, string> = {}

      locales.forEach((altLocale) => {
        alternates[altLocale] = `${baseUrl}/${altLocale}${path}`
      })

      alternates["x-default"] = `${baseUrl}/${defaultLocale}${path}`

      sitemapEntries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: lastModified || new Date(),
        alternates,
      })
    })
  }

  addMultilingualEntries("")
  ;["/contact", "/brands"].forEach((page) => addMultilingualEntries(page))

  const { data: brands } = await supabase.from("brands").select("slug, updated_at").not("slug", "is", null)
  brands?.forEach((brand) => {
    if (brand.slug) addMultilingualEntries(`/brands/${brand.slug}`, brand.updated_at ? new Date(brand.updated_at) : new Date())
  })

  const { data: series } = await supabase.from("series").select("slug, updated_at").not("slug", "is", null)
  series?.forEach((serie) => {
    if (serie.slug) addMultilingualEntries(`/series/${serie.slug}`, serie.updated_at ? new Date(serie.updated_at) : new Date())
  })

  const { data: models } = await supabase.from("models").select("slug, updated_at").not("slug", "is", null)
  models?.forEach((model) => {
    if (model.slug) addMultilingualEntries(`/models/${model.slug}`, model.updated_at ? new Date(model.updated_at) : new Date())
  })

  const { data: services } = await supabase.from("services").select("id, slug, created_at").not("slug", "is", null)
  if (services) {
    services.forEach((service) => {
      if (service.slug) addMultilingualEntries(`/services/${service.slug}`, service.created_at ? new Date(service.created_at) : new Date())
    })

    const serviceIds = services.map((service) => service.id)
    const { data: allModelServices } = await supabase
      .from("model_services")
      .select("service_id, models(slug), services(slug, created_at)")
      .in("service_id", serviceIds)
      .not("models.slug", "is", null)

    allModelServices?.forEach((modelService) => {
      const model = modelService.models as unknown as { slug: string } | null
      const service = modelService.services as unknown as { slug: string; created_at: string } | null
      if (model?.slug && service?.slug) {
        addMultilingualEntries(`/services/${service.slug}/${model.slug}`, service.created_at ? new Date(service.created_at) : new Date())
      }
    })
  }

  addMultilingualEntries("/articles")

  const { data: articleTranslations } = await supabase
    .from("article_translations")
    .select("article_id, slug, locale, updated_at, articles(updated_at, published)")
    .eq("articles.published", true)
    .not("slug", "is", null)

  if (articleTranslations) {
    const processedArticles = new Set<string>()

    articleTranslations.forEach((translation: any) => {
      const articleId = translation.article_id
      if (processedArticles.has(articleId)) return

      const allTranslations = articleTranslations.filter((item: any) => item.article_id === articleId)
      const alternates: Record<string, string> = {}

      allTranslations.forEach((item: any) => {
        alternates[item.locale] = `${baseUrl}/${item.locale}/articles/${item.slug}`
      })

      alternates["x-default"] =
        `${baseUrl}/${defaultLocale}/articles/${allTranslations.find((item: any) => item.locale === defaultLocale)?.slug || allTranslations[0].slug}`

      allTranslations.forEach((item: any) => {
        sitemapEntries.push({
          url: `${baseUrl}/${item.locale}/articles/${item.slug}`,
          lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
          alternates,
        })
      })

      processedArticles.add(articleId)
    })
  }

  return sitemapEntries
}
```

- [ ] **Step 4: Replace sitemap metadata route with route handler**

Delete `app/sitemap.ts`.

Create `app/sitemap.xml/route.ts`:

```ts
import { headers } from "next/headers"

import { isB2BHost } from "@/lib/b2b-routing"
import { getB2BSitemapEntries } from "@/lib/seo/b2b-sitemap"
import { getMainSitemapEntries } from "@/lib/seo/main-sitemap"
import { createSitemapXml } from "@/lib/seo/sitemap-xml"

export async function GET() {
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""
  const entries = isB2BHost(host) ? getB2BSitemapEntries() : await getMainSitemapEntries()

  return new Response(createSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
```

- [ ] **Step 5: Replace robots metadata route with route handler**

Delete `app/robots.ts`.

Create `app/robots.txt/route.ts`:

```ts
import { headers } from "next/headers"

import { isB2BHost } from "@/lib/b2b-routing"
import { b2bSiteUrl, mainSiteUrl } from "@/lib/site-config"

export async function GET() {
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""
  const isB2B = isB2BHost(host)
  const baseUrl = isB2B ? b2bSiteUrl : mainSiteUrl

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/",
    isB2B ? "Disallow: /cs/auth/" : "",
    isB2B ? "Disallow: /uk/auth/" : "",
    isB2B ? "Disallow: /en/auth/" : "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `Host: ${baseUrl}`,
    "",
  ]
    .filter(Boolean)
    .join("\n")

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
```

- [ ] **Step 6: Run build**

Run:

```bash
npm run build
```

Expected: build exits 0.

- [ ] **Step 7: Commit SEO route handlers**

```bash
git add app/sitemap.xml/route.ts app/robots.txt/route.ts lib/seo/sitemap-xml.ts lib/seo/b2b-sitemap.ts lib/seo/main-sitemap.ts
git add -u app/sitemap.ts app/robots.ts
git commit -m "feat: add host-aware b2b seo routes"
```

---

### Task 9: Final Verification

**Files:**
- No planned file changes unless verification finds a defect.

- [ ] **Step 1: Run focused unit tests**

Run:

```bash
npm run test:b2b-routing
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: build exits 0.

- [ ] **Step 3: Start local server**

Run:

```bash
npm run dev
```

Expected: Next dev server starts and prints a local URL, usually `http://localhost:3000`.

- [ ] **Step 4: Verify B2B redirects with Host header**

In a second terminal, run:

```bash
curl.exe -I -H "Host: b2b.devicehelp.cz" "http://localhost:3000/cs/brands/apple?x=1"
```

Expected: `308` redirect with `Location: https://devicehelp.cz/cs/brands/apple?x=1`.

Run:

```bash
curl.exe -I -H "Host: b2b.devicehelp.cz" "http://localhost:3000/cs/faq"
```

Expected: not a redirect to main domain. A `200` is ideal; a temporary dev compilation response is acceptable if the page then loads in the browser.

- [ ] **Step 5: Verify sitemap with Host header**

Run:

```bash
curl.exe -H "Host: b2b.devicehelp.cz" "http://localhost:3000/sitemap.xml"
```

Expected: XML includes `https://b2b.devicehelp.cz/cs`, `https://b2b.devicehelp.cz/cs/faq`, and does not include `/brands/`, `/models/`, `/services/`, or `/articles/`.

- [ ] **Step 6: Browser visual checks**

Use the Browser plugin or local browser:

- Open `http://localhost:3000/cs` with Host `b2b.devicehelp.cz` if browser tooling supports custom host headers; otherwise test through a temporary local hosts entry or Coolify preview domain.
- Check desktop width around 1440px.
- Check mobile width around 390px.
- Confirm first viewport clearly says company/business service.
- Confirm CTA text is `Registrovat firemní účet`.
- Confirm CTA URL points to `https://devicehelp.cz/cs/auth/register?b2b=1`.
- Confirm nav does not link to B2B copies of catalog pages.

- [ ] **Step 7: Commit final fixes if any**

If verification required fixes:

```bash
git status --short
git add app components lib messages middleware.ts package.json package-lock.json tests
git commit -m "fix: polish b2b microsite verification issues"
```

If no fixes were required, do not create an empty commit.
