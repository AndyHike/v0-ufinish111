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
    if (error?.code === "ENOENT") return false
    throw error
  }
}

test("homepage mounts a lazy personal offer loader without server-side session reads", async () => {
  const source = await readSource("../app/[locale]/page.tsx")

  assert.match(source, /PersonalOfferToastLoader/)
  assert.doesNotMatch(source, /getSession/)
  assert.doesNotMatch(source, /getPersonalProfileOffers/)
  assert.doesNotMatch(source, /cookies\(\)/)
})

test("personal offer API keeps profile-offer logic off the public homepage render path", async () => {
  assert.equal(await pathExists("../app/api/user/personal-offer/route.ts"), true)

  const source = await readSource("../app/api/user/personal-offer/route.ts")

  assert.match(source, /getCurrentUser/)
  assert.match(source, /getPersonalProfileOffers/)
  assert.match(source, /Cache-Control/)
  assert.match(source, /private, no-cache/)
})

test("personal offer toast loader fetches after the first page load path", async () => {
  assert.equal(await pathExists("../components/profile/personal-offer-toast-loader.tsx"), true)

  const source = await readSource("../components/profile/personal-offer-toast-loader.tsx")

  assert.match(source, /requestIdleCallback|setTimeout/)
  assert.match(source, /\/api\/user\/personal-offer/)
  assert.match(source, /cache:\s*"no-cache"/)
  assert.match(source, /PersonalOfferToast/)
})
