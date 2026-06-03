import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const rawB2BAccountWording = /B2B\s+(?:account|účet|účtu|акаунт)/i

function assertNonEmptyString(value, label) {
  assert.equal(typeof value, "string", label)
  assert.notEqual(value.trim(), "", `${label} is not empty`)
}

function countMatches(source, pattern) {
  return source.match(pattern)?.length ?? 0
}

function extractB2BNavigationSource(source, label) {
  const startMarker = "const b2bNavigation = ["
  const start = source.indexOf(startMarker)
  assert.notEqual(start, -1, `${label} b2bNavigation declaration`)

  const end = source.indexOf("const navigation", start)
  assert.notEqual(end, -1, `${label} navigation marker`)

  return source.slice(start, end)
}

function assertOrderedSourceMatches(source, checks, label) {
  let searchStart = 0

  for (const { description, pattern } of checks) {
    const match = pattern.exec(source.slice(searchStart))
    assert.ok(match, `${label} ${description}`)
    searchStart += match.index + match[0].length
  }
}

async function pathExists(path) {
  try {
    await readFile(new URL(path, import.meta.url), "utf8")
    return true
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false
    }

    throw error
  }
}

test("B2B FAQ route is host-gated and canonicalized to the B2B subdomain", async () => {
  assert.equal(await pathExists("../app/b2b/[locale]/faq/page.tsx"), true)

  const source = await readFile(new URL("../app/b2b/[locale]/faq/page.tsx", import.meta.url), "utf8")

  assert.match(source, /b2bSiteUrl/)
  assert.match(source, /B2BFAQPage/)
  assert.doesNotMatch(source, /headers\(\)/)
  assert.doesNotMatch(source, /isB2BHost/)
})

test("B2B FAQ component links registration to the main-domain business account flow", async () => {
  assert.equal(await pathExists("../components/b2b/b2b-faq-page.tsx"), true)

  const source = await readFile(new URL("../components/b2b/b2b-faq-page.tsx", import.meta.url), "utf8")

  assert.match(source, /mainSiteUrl/)
  assert.match(source, /auth\/register\?b2b=1/)
})

test("B2B layout does not render the main-site promotional banner", async () => {
  const source = await readFile(new URL("../app/b2b/[locale]/layout.tsx", import.meta.url), "utf8")

  assert.match(source, /variant="b2b"/)
  assert.doesNotMatch(source, /PromotionalBanner/)
  assert.doesNotMatch(source, /headers\(\)/)
})

test("main public layout and homepage no longer branch on host headers", async () => {
  const layoutSource = await readFile(new URL("../app/[locale]/layout.tsx", import.meta.url), "utf8")
  const homeSource = await readFile(new URL("../app/[locale]/page.tsx", import.meta.url), "utf8")

  assert.doesNotMatch(layoutSource, /headers\(\)/)
  assert.doesNotMatch(layoutSource, /isB2BHost/)
  assert.doesNotMatch(homeSource, /headers\(\)/)
  assert.doesNotMatch(homeSource, /isB2BHost/)
  assert.doesNotMatch(homeSource, /B2BHomePage/)
})

test("B2B FAQ messages exist for every supported locale", async () => {
  for (const locale of ["cs", "uk", "en"]) {
    const raw = await readFile(new URL(`../messages/${locale}.json`, import.meta.url), "utf8")
    const messages = JSON.parse(raw)
    const faq = messages.B2B?.faq

    assert.equal(typeof faq?.metadataTitle, "string", `${locale} metadata title`)
    assert.equal(typeof faq?.metadataDescription, "string", `${locale} metadata description`)
    assert.equal(typeof faq?.title, "string", `${locale} title`)
    assert.equal(typeof faq?.subtitle, "string", `${locale} subtitle`)
    assert.ok(Array.isArray(faq?.items), `${locale} items`)
    assert.ok(faq.items.length >= 5, `${locale} FAQ has at least five items`)

    for (const item of faq.items) {
      assert.equal(typeof item.question, "string", `${locale} FAQ question`)
      assert.equal(typeof item.answer, "string", `${locale} FAQ answer`)
    }
  }
})

test("B2B home messages expose redesigned sections for every supported locale", async () => {
  for (const locale of ["cs", "uk", "en"]) {
    const raw = await readFile(new URL(`../messages/${locale}.json`, import.meta.url), "utf8")
    const messages = JSON.parse(raw)
    const home = messages.B2B?.home

    assertNonEmptyString(home?.title, `${locale} title`)
    assertNonEmptyString(home?.subtitle, `${locale} subtitle`)
    assertNonEmptyString(home?.primaryCta, `${locale} primary CTA`)
    assertNonEmptyString(home?.secondaryCta, `${locale} secondary CTA`)

    assert.ok(Array.isArray(home?.proofRows), `${locale} proof rows`)
    assert.equal(home.proofRows.length, 3, `${locale} proof row count`)
    for (const proofRow of home.proofRows) {
      assertNonEmptyString(proofRow, `${locale} proof row`)
    }

    assertNonEmptyString(home?.cooperationTitle, `${locale} cooperation title`)
    assertNonEmptyString(home?.cooperationText, `${locale} cooperation text`)
    assert.ok(Array.isArray(home?.cooperationBenefits), `${locale} cooperation benefits`)
    assert.equal(home.cooperationBenefits.length, 6, `${locale} cooperation benefit count`)

    assertNonEmptyString(home?.accountTitle, `${locale} account title`)
    assertNonEmptyString(home?.accountText, `${locale} account text`)
    assert.ok(Array.isArray(home?.accountFeatures), `${locale} account features`)
    assert.equal(home.accountFeatures.length, 5, `${locale} account feature count`)

    assertNonEmptyString(home?.processText, `${locale} process text`)
    assert.ok(Array.isArray(home?.processSteps), `${locale} process steps`)
    assert.equal(home.processSteps.length, 4, `${locale} process step count`)

    for (const [key, items] of Object.entries({
      cooperationBenefits: home.cooperationBenefits,
      accountFeatures: home.accountFeatures,
      processSteps: home.processSteps,
    })) {
      for (const item of items) {
        assertNonEmptyString(item.title, `${locale} ${key} title`)
        assertNonEmptyString(item.text, `${locale} ${key} text`)
      }
    }

    const content = JSON.stringify(home)
    assert.doesNotMatch(content, rawB2BAccountWording)
  }
})

test("desktop B2B navigation exposes redesigned href order", async () => {
  const headerSource = await readFile(new URL("../components/header.tsx", import.meta.url), "utf8")
  const b2bNavigation = extractB2BNavigationSource(headerSource, "desktop")

  assert.equal(countMatches(b2bNavigation, /\bhref\s*:/g), 6, "desktop B2B nav href count")
  assertOrderedSourceMatches(
    b2bNavigation,
    [
      { description: "home href", pattern: /href\s*:\s*`\/\$\{locale\}`/ },
      { description: "benefits href", pattern: /href\s*:\s*`\/\$\{locale\}#benefits`/ },
      { description: "account href", pattern: /href\s*:\s*`\/\$\{locale\}#account`/ },
      { description: "how it works href", pattern: /href\s*:\s*`\/\$\{locale\}#how-it-works`/ },
      { description: "FAQ href", pattern: /href\s*:\s*`\/\$\{locale\}\/faq`/ },
      { description: "main-domain brands href", pattern: /href\s*:\s*`\$\{mainDomain\}\/\$\{locale\}\/brands`/ },
    ],
    "desktop B2B nav",
  )
})

test("B2B header preserves the host-derived variant during hydration", async () => {
  const headerSource = await readFile(new URL("../components/header.tsx", import.meta.url), "utf8")

  assert.match(headerSource, /const isB2BVariant = variant === "b2b"/)
  assert.match(headerSource, /variant=\{isB2BVariant \? "b2b" : "default"\}/)
  assert.doesNotMatch(headerSource, /isB2BHost/)
  assert.doesNotMatch(headerSource, /window\.location\.host/)
  assert.doesNotMatch(headerSource, /hostDerivedVariant/)
})

test("B2B navigation keeps public locale paths after the internal rewrite", async () => {
  const shellSource = await readFile(new URL("../components/site-locale-layout.tsx", import.meta.url), "utf8")
  const headerSource = await readFile(new URL("../components/header.tsx", import.meta.url), "utf8")
  const mobileSource = await readFile(new URL("../components/mobile-nav.tsx", import.meta.url), "utf8")

  assert.match(shellSource, /localeOverride=\{locale\}/)
  assert.match(headerSource, /localeOverride\?: string/)
  assert.match(headerSource, /startsWith\("\/b2b\/"\)/)
  assert.match(headerSource, /pathname\.replace\(/)
  assert.match(headerSource, /localeOverride=\{locale\}/)
  assert.match(mobileSource, /localeOverride\?: string/)
  assert.match(mobileSource, /startsWith\("\/b2b\/"\)/)
  assert.match(mobileSource, /pathname\.replace\(/)
})

test("B2B header uses one account CTA instead of a duplicated register button", async () => {
  const headerSource = await readFile(new URL("../components/header.tsx", import.meta.url), "utf8")
  const userNavSource = await readFile(new URL("../components/user-nav.tsx", import.meta.url), "utf8")

  assert.doesNotMatch(
    headerSource,
    /isB2BVariant\s*&&\s*\(\s*<Button asChild size="sm"[\s\S]*?registerBusinessAccount[\s\S]*?<\/Button>\s*\)/,
    "standalone B2B register button is removed from Header",
  )
  assert.match(headerSource, /<UserNav[\s\S]*variant=\{isB2BVariant \? "b2b" : "default"\}/)
  assert.match(headerSource, /businessRegisterHref=\{`\$\{mainDomain\}\/\$\{locale\}\/auth\/register\?b2b=1`\}/)
  assert.match(headerSource, /businessRegisterLabel=\{t\("registerBusinessAccount"\)\}/)

  assert.match(userNavSource, /variant\?: "default" \| "b2b"/)
  assert.match(userNavSource, /businessRegisterHref\?: string/)
  assert.match(userNavSource, /businessRegisterLabel\?: string/)
  assert.match(userNavSource, /variant === "b2b"/)
  assert.match(userNavSource, /businessRegisterHref \?\? `\/\$\{locale\}\/auth\/register\?b2b=1`/)
  assert.match(userNavSource, /<Button asChild variant=\{isB2BVariant \? "default" : "outline"\}/)
  assert.match(userNavSource, /variant=\{isB2BVariant \? "default" : "outline"\}/)
})

test("B2B header delays dense desktop controls until wider breakpoints", async () => {
  const headerSource = await readFile(new URL("../components/header.tsx", import.meta.url), "utf8")

  assert.match(headerSource, /desktopMenuTriggerClassName = isB2BVariant \? "xl:hidden" : "md:hidden"/)
  assert.match(headerSource, /desktopSearchClassName = isB2BVariant/)
  assert.match(headerSource, /desktopSearchClassName = isB2BVariant \? "hidden" : "hidden md:flex flex-1 max-w-md mx-6"/)
  assert.match(headerSource, /desktopNavClassName = isB2BVariant/)
  assert.match(headerSource, /"hidden min-w-0 items-center gap-3 xl:flex xl:gap-4"/)
})

test("mobile B2B navigation keeps the approved four-item scope", async () => {
  const mobileSource = await readFile(new URL("../components/mobile-nav.tsx", import.meta.url), "utf8")
  const b2bNavigation = extractB2BNavigationSource(mobileSource, "mobile")

  assert.equal(countMatches(b2bNavigation, /\bhref\s*:/g), 4, "mobile B2B nav href count")
  assert.doesNotMatch(b2bNavigation, /#how-it-works/)
  assert.doesNotMatch(b2bNavigation, /auth\/register\?b2b=1/)
  assertOrderedSourceMatches(
    b2bNavigation,
    [
      { description: "home href", pattern: /href\s*:\s*`\/\$\{locale\}`/ },
      { description: "benefits href", pattern: /href\s*:\s*`\/\$\{locale\}#benefits`/ },
      { description: "account href", pattern: /href\s*:\s*`\/\$\{locale\}#account`/ },
      { description: "FAQ href", pattern: /href\s*:\s*`\/\$\{locale\}\/faq`/ },
    ],
    "mobile B2B nav",
  )
  assert.match(mobileSource, /flex-1/)
  assert.doesNotMatch(mobileSource, /w-1\/4/)
})

test("B2B home page exposes redesigned section target IDs", async () => {
  const homeSource = await readFile(new URL("../components/b2b/b2b-home-page.tsx", import.meta.url), "utf8")

  assert.match(homeSource, /<section\b[^>]*\bid\s*=\s*["']benefits["']/)
  assert.match(homeSource, /<section\b[^>]*\bid\s*=\s*["']account["']/)
  assert.match(homeSource, /<section\b[^>]*\bid\s*=\s*["']how-it-works["']/)
})

test("business registration query preselects the company account flow", async () => {
  const source = await readFile(
    new URL("../app/[locale]/auth/register/register-client.tsx", import.meta.url),
    "utf8",
  )

  assert.match(source, /useSearchParams/)
  assert.match(source, /searchParams\.get\("b2b"\) === "1"/)
  assert.match(source, /isB2B:\s*isBusinessRegistration/)
  assert.match(source, /setValue\("isB2B", true/)
  assert.match(source, /businessClient/)
  assert.doesNotMatch(source, rawB2BAccountWording)
})

test("business account labels avoid raw B2B account wording", async () => {
  const expected = {
    cs: "Firemní účet / podnikatel",
    uk: "Акаунт для компанії / підприємця",
    en: "Business account / entrepreneur",
  }

  for (const [locale, label] of Object.entries(expected)) {
    const raw = await readFile(new URL(`../messages/${locale}.json`, import.meta.url), "utf8")
    const messages = JSON.parse(raw)

    assert.equal(messages.Auth?.businessClient, label)
    assert.doesNotMatch(messages.Auth.businessClient, /B2B/i)
  }
})
