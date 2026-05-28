import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

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
  assert.equal(await pathExists("../app/[locale]/faq/page.tsx"), true)

  const source = await readFile(new URL("../app/[locale]/faq/page.tsx", import.meta.url), "utf8")

  assert.match(source, /isB2BHost/)
  assert.match(source, /notFound\(\)/)
  assert.match(source, /b2bSiteUrl/)
  assert.match(source, /B2BFAQPage/)
})

test("B2B FAQ component links registration to the main-domain business account flow", async () => {
  assert.equal(await pathExists("../components/b2b/b2b-faq-page.tsx"), true)

  const source = await readFile(new URL("../components/b2b/b2b-faq-page.tsx", import.meta.url), "utf8")

  assert.match(source, /mainSiteUrl/)
  assert.match(source, /auth\/register\?b2b=1/)
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

    assert.equal(typeof home?.title, "string", `${locale} title`)
    assert.equal(typeof home?.subtitle, "string", `${locale} subtitle`)
    assert.equal(typeof home?.primaryCta, "string", `${locale} primary CTA`)
    assert.equal(typeof home?.secondaryCta, "string", `${locale} secondary CTA`)

    assert.ok(Array.isArray(home?.proofRows), `${locale} proof rows`)
    assert.equal(home.proofRows.length, 3, `${locale} proof row count`)

    assert.equal(typeof home?.cooperationTitle, "string", `${locale} cooperation title`)
    assert.equal(typeof home?.cooperationText, "string", `${locale} cooperation text`)
    assert.ok(Array.isArray(home?.cooperationBenefits), `${locale} cooperation benefits`)
    assert.equal(home.cooperationBenefits.length, 6, `${locale} cooperation benefit count`)

    assert.equal(typeof home?.accountTitle, "string", `${locale} account title`)
    assert.equal(typeof home?.accountText, "string", `${locale} account text`)
    assert.ok(Array.isArray(home?.accountFeatures), `${locale} account features`)
    assert.equal(home.accountFeatures.length, 5, `${locale} account feature count`)

    assert.equal(typeof home?.processText, "string", `${locale} process text`)
    assert.ok(Array.isArray(home?.processSteps), `${locale} process steps`)
    assert.equal(home.processSteps.length, 4, `${locale} process step count`)

    for (const [key, items] of Object.entries({
      cooperationBenefits: home.cooperationBenefits,
      accountFeatures: home.accountFeatures,
      processSteps: home.processSteps,
    })) {
      for (const item of items) {
        assert.equal(typeof item.title, "string", `${locale} ${key} title`)
        assert.equal(typeof item.text, "string", `${locale} ${key} text`)
      }
    }

    const content = JSON.stringify(home)
    assert.doesNotMatch(content, /B2B account|B2B účet|B2B акаунт/i)
  }
})

test("B2B navigation exposes redesigned section anchors", async () => {
  const headerSource = await readFile(new URL("../components/header.tsx", import.meta.url), "utf8")
  const mobileSource = await readFile(new URL("../components/mobile-nav.tsx", import.meta.url), "utf8")

  assert.match(headerSource, /#benefits/)
  assert.match(headerSource, /#account/)
  assert.match(headerSource, /#how-it-works/)
  assert.match(headerSource, /auth\/register\?b2b=1/)
  assert.match(mobileSource, /#benefits/)
  assert.match(mobileSource, /#account/)
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
  assert.doesNotMatch(source, /B2B (účtu|account|акаун)/i)
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
