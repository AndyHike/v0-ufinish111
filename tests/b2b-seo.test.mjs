import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

async function readSource(path) {
  return readFile(new URL(path, import.meta.url), "utf8")
}

async function pathExists(path) {
  try {
    await readSource(path)
    return true
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false
    }

    throw error
  }
}

test("sitemap is served by a host-aware route handler", async () => {
  assert.equal(await pathExists("../app/sitemap.ts"), false)
  assert.equal(await pathExists("../app/sitemap.xml/route.ts"), true)

  const source = await readSource("../app/sitemap.xml/route.ts")

  assert.match(source, /isB2BHost/)
  assert.match(source, /getB2BSitemapEntries/)
  assert.match(source, /getMainSitemapEntries/)
  assert.match(source, /createSitemapXml/)
  assert.match(source, /application\/xml/)
})

test("B2B sitemap exposes only localized home and FAQ pages", async () => {
  assert.equal(await pathExists("../lib/seo/b2b-sitemap.ts"), true)

  const source = await readSource("../lib/seo/b2b-sitemap.ts")

  for (const locale of ["cs", "uk", "en"]) {
    assert.match(source, new RegExp(`\\$\\{b2bSiteUrl\\}/\\$\\{locale\\}`))
  }

  assert.match(source, /"\/faq"/)
  assert.doesNotMatch(source, /brands|models|services|articles/)
})

test("robots is served by a host-aware route handler", async () => {
  assert.equal(await pathExists("../app/robots.ts"), false)
  assert.equal(await pathExists("../app/robots.txt/route.ts"), true)

  const source = await readSource("../app/robots.txt/route.ts")

  assert.match(source, /isB2BHost/)
  assert.match(source, /b2bSiteUrl/)
  assert.match(source, /mainSiteUrl/)
  assert.match(source, /Disallow: \/cs\/auth\//)
  assert.match(source, /Sitemap: \$\{baseUrl\}\/sitemap\.xml/)
})

test("sitemap XML helper escapes XML-sensitive characters", async () => {
  assert.equal(await pathExists("../lib/seo/sitemap-xml.ts"), true)

  const source = await readSource("../lib/seo/sitemap-xml.ts")

  assert.match(source, /replace\(\s*\/&\/g,\s*"&amp;"\s*\)/)
  assert.match(source, /xmlns:xhtml/)
  assert.match(source, /rel="alternate"/)
})
