import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

test("Google reviews use a persistent server cache instead of per-request React cache", async () => {
  const source = await readFile(new URL("../lib/data/google-reviews.ts", import.meta.url), "utf8")

  assert.match(source, /unstable_cache/)
  assert.match(source, /revalidate:\s*3600/)
  assert.doesNotMatch(source, /from "react"/)
  assert.doesNotMatch(source, /key=\$\{apiKey\}/)
})

test("Google Places API errors are cacheable instead of thrown on every request", async () => {
  const source = await readFile(new URL("../lib/data/google-reviews.ts", import.meta.url), "utf8")

  assert.doesNotMatch(source, /throw new Error\(`Google Places API returned/)
  assert.match(source, /if \(!response\.ok\)[\s\S]*return null/)
})

test("homepage keeps the Google reviews section visible when the API returns no data", async () => {
  const source = await readFile(new URL("../app/[locale]/page.tsx", import.meta.url), "utf8")

  assert.match(source, /EMPTY_GOOGLE_REVIEWS/)
  assert.match(source, /googleReviews \?\? EMPTY_GOOGLE_REVIEWS/)
})

test("resolved empty Google reviews do not keep showing a loading message", async () => {
  const source = await readFile(new URL("../components/google-reviews-carousel.tsx", import.meta.url), "utf8")

  assert.doesNotMatch(source, /t\("loading"\)/)
})
