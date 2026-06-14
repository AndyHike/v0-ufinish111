import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

test("Google reviews use Google Business Profile OAuth with a persistent server cache", async () => {
  const source = await readFile(new URL("../lib/data/google-reviews.ts", import.meta.url), "utf8")

  assert.match(source, /unstable_cache/)
  assert.match(source, /revalidate:\s*86400/)
  assert.match(source, /https:\/\/www\.googleapis\.com\/auth\/business\.manage/)
  assert.match(source, /https:\/\/oauth2\.googleapis\.com\/token/)
  assert.match(source, /GOOGLE_BUSINESS_PROFILE_API_ORIGIN = "https:\/\/mybusiness\.googleapis\.com"/)
  assert.match(source, /\/v4\/\$\{locationName\}\/reviews/)
  assert.match(source, /GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN/)
  assert.doesNotMatch(source, /from "react"/)
  assert.doesNotMatch(source, /key=\$\{apiKey\}/)
  // The new Places API origin requires its own enablement; we use the legacy Place Details endpoint.
  assert.doesNotMatch(source, /places\.googleapis\.com/)
})

test("Google reviews fall back to the Place Details API until Business Profile access is approved", async () => {
  const source = await readFile(new URL("../lib/data/google-reviews.ts", import.meta.url), "utf8")

  assert.match(source, /GOOGLE_PLACES_API_KEY/)
  assert.match(source, /GOOGLE_PLACES_ID/)
  assert.match(source, /maps\.googleapis\.com\/maps\/api\/place\/details\/json/)
  // Business Profile stays primary; Places is only the fallback.
  assert.match(source, /fetchGoogleReviewsFromApi\(\)[\s\S]*fetchGoogleReviewsFromPlaces\(locale\)/)
  // The cached fetcher wraps the combined source, not the Business-Profile-only path.
  assert.match(source, /unstable_cache\(fetchGoogleReviews,/)
})

test("Google reviews are curated (1-star dropped, 5-star first) and translated per locale", async () => {
  const source = await readFile(new URL("../lib/data/google-reviews.ts", import.meta.url), "utf8")

  // Drop 1-star reviews.
  assert.match(source, /review\.rating >= 2/)
  // 5-star first, newest within a rating.
  assert.match(source, /b\.rating - a\.rating \|\| b\.time - a\.time/)
  // Curation is shared by both the Business Profile and Places paths.
  assert.match(source, /curateReviews\(\(data\.reviews/)
  assert.match(source, /curateReviews\(\(result\.reviews/)
  // Places asks Google to translate into the visitor locale.
  assert.match(source, /url\.searchParams\.set\("language", locale\)/)
  // Cache is keyed per locale.
  assert.match(source, /getCachedGoogleReviews\(locale\)/)
})

test("Google Business Profile API errors are cacheable instead of thrown on every request", async () => {
  const source = await readFile(new URL("../lib/data/google-reviews.ts", import.meta.url), "utf8")

  assert.doesNotMatch(source, /throw new Error\(`Google Business Profile/)
  assert.match(source, /if \(!response\.ok\)[\s\S]*return null/)
})

test("Google Business Profile reviews are mapped to the existing carousel shape", async () => {
  const source = await readFile(new URL("../lib/data/google-reviews.ts", import.meta.url), "utf8")

  assert.match(source, /reviewer\.displayName/)
  assert.match(source, /reviewer\.profilePhotoUrl/)
  assert.match(source, /review\.comment/)
  assert.match(source, /review\.updateTime \?\? review\.createTime/)
  assert.match(source, /averageRating/)
  assert.match(source, /totalReviewCount/)
  assert.match(source, /ONE:\s*1/)
  assert.match(source, /FIVE:\s*5/)
})

test("homepage keeps the Google reviews section visible when the API returns no data", async () => {
  const source = await readFile(new URL("../app/[locale]/page.tsx", import.meta.url), "utf8")

  assert.match(source, /EMPTY_GOOGLE_REVIEWS/)
  assert.match(source, /googleReviews \?\? EMPTY_GOOGLE_REVIEWS/)
})

test("resolved empty Google reviews do not keep showing a loading message", async () => {
  const source = await readFile(new URL("../components/google-reviews-carousel.tsx", import.meta.url), "utf8")

  assert.doesNotMatch(source, /t\("loading"\)/)
  assert.doesNotMatch(source, /AggregateRating/)
})

test("OAuth helper prints Business Profile env names and discovers accounts and locations", async () => {
  const source = await readFile(new URL("../scripts/google-business-profile-oauth.mjs", import.meta.url), "utf8")

  assert.match(source, /GOOGLE_BUSINESS_PROFILE_CLIENT_ID/)
  assert.match(source, /GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET/)
  assert.match(source, /GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN/)
  assert.match(source, /GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID/)
  assert.match(source, /GOOGLE_BUSINESS_PROFILE_LOCATION_ID/)
  assert.match(source, /mybusinessaccountmanagement\.googleapis\.com\/v1\/accounts/)
  assert.match(source, /mybusinessbusinessinformation\.googleapis\.com\/v1\/\$\{account\.name\}\/locations/)
})

test("Docker runtime passes Google Business Profile review environment variables", async () => {
  const source = await readFile(new URL("../docker-compose.yml", import.meta.url), "utf8")

  assert.match(source, /GOOGLE_BUSINESS_PROFILE_CLIENT_ID/)
  assert.match(source, /GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET/)
  assert.match(source, /GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN/)
  assert.match(source, /GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID/)
  assert.match(source, /GOOGLE_BUSINESS_PROFILE_LOCATION_ID/)
  assert.match(source, /GOOGLE_BUSINESS_PROFILE_LOCATION_NAME/)
})
