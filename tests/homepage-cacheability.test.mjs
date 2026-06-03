import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

test("public homepage data loaders avoid request cookies", async () => {
  const homeSource = await readFile(new URL("../app/[locale]/page.tsx", import.meta.url), "utf8")
  const brandsSource = await readFile(new URL("../lib/data/brands.ts", import.meta.url), "utf8")

  assert.doesNotMatch(homeSource, /headers\(\)/)
  assert.doesNotMatch(homeSource, /cookies\(\)/)
  assert.doesNotMatch(brandsSource, /utils\/supabase\/server/)
  assert.doesNotMatch(brandsSource, /cookies\(\)/)
})
