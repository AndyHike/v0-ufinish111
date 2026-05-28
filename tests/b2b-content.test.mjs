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
