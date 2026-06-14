import { unstable_cache } from "next/cache"

const GOOGLE_BUSINESS_PROFILE_SCOPE = "https://www.googleapis.com/auth/business.manage"
const GOOGLE_BUSINESS_PROFILE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_BUSINESS_PROFILE_API_ORIGIN = "https://mybusiness.googleapis.com"
const GOOGLE_BUSINESS_PROFILE_REVIEWS_PAGE_SIZE = "50"

// Fallback used until the Business Profile API access request is approved.
// Legacy Place Details returns up to 5 newest reviews + rating without special approval.
const GOOGLE_PLACES_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

export interface GoogleReview {
  author_name: string
  rating: number
  text: string
  time: number
  profile_photo_url?: string
}

export interface GoogleReviewsData {
  reviews: GoogleReview[]
  rating: number
  totalReviews: number
  businessName?: string
}

interface GoogleBusinessProfileConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  locationName: string
}

function normalizeGoogleBusinessProfileLocationName(): string | null {
  const explicitLocationName = process.env.GOOGLE_BUSINESS_PROFILE_LOCATION_NAME?.trim().replace(/^\/+|\/+$/g, "")

  if (explicitLocationName) {
    return /^accounts\/[^/]+\/locations\/[^/]+$/.test(explicitLocationName) ? explicitLocationName : null
  }

  const accountId = process.env.GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID?.trim().replace(/^accounts\//, "")
  const locationId = process.env.GOOGLE_BUSINESS_PROFILE_LOCATION_ID?.trim()
    .replace(/^accounts\/[^/]+\/locations\//, "")
    .replace(/^locations\//, "")

  if (!accountId || !locationId) {
    return null
  }

  return `accounts/${encodeURIComponent(accountId)}/locations/${encodeURIComponent(locationId)}`
}

function getGoogleBusinessProfileConfig(): GoogleBusinessProfileConfig | null {
  const clientId = process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN
  const locationName = normalizeGoogleBusinessProfileLocationName()

  if (!clientId || !clientSecret || !refreshToken || !locationName) {
    return null
  }

  return {
    clientId,
    clientSecret,
    refreshToken,
    locationName,
  }
}

async function fetchGoogleBusinessProfileAccessToken(config: GoogleBusinessProfileConfig): Promise<string | null> {
  try {
    const response = await fetch(GOOGLE_BUSINESS_PROFILE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      if (process.env.DEBUG_GOOGLE_REVIEWS === "true") {
        console.warn("[v0] Google Business Profile token error status:", response.status)
      }
      return null
    }

    const data = await response.json()

    return typeof data.access_token === "string" && data.access_token ? data.access_token : null
  } catch (error) {
    console.error("[v0] Google Business Profile token request failed:", error)
    return null
  }
}

function googleBusinessProfileRatingToNumber(starRating: unknown): number {
  if (typeof starRating === "number" && Number.isFinite(starRating)) {
    return Math.max(0, Math.min(5, starRating))
  }

  const ratings: Record<string, number> = {
    STAR_RATING_UNSPECIFIED: 0,
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  }

  return ratings[String(starRating || "").toUpperCase()] ?? 0
}

function parseGoogleBusinessProfileTimestamp(value: unknown): number {
  if (typeof value !== "string" || !value) {
    return 0
  }

  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp / 1000 : 0
}

function mapGoogleBusinessProfileReview(review: any): GoogleReview {
  const reviewer = review.reviewer || {}

  return {
    author_name: reviewer.displayName || "Anonymous",
    rating: googleBusinessProfileRatingToNumber(review.starRating),
    text: typeof review.comment === "string" ? review.comment : "",
    time: parseGoogleBusinessProfileTimestamp(review.updateTime ?? review.createTime),
    profile_photo_url: reviewer.profilePhotoUrl,
  }
}

async function fetchGoogleReviewsFromApi(): Promise<GoogleReviewsData | null> {
  const config = getGoogleBusinessProfileConfig()

  if (!config) {
    return null
  }

  const accessToken = await fetchGoogleBusinessProfileAccessToken(config)

  if (!accessToken) {
    return null
  }

  const locationName = config.locationName
  const url = new URL(`${GOOGLE_BUSINESS_PROFILE_API_ORIGIN}/v4/${locationName}/reviews`)
  url.searchParams.set("pageSize", GOOGLE_BUSINESS_PROFILE_REVIEWS_PAGE_SIZE)
  url.searchParams.set("orderBy", "updateTime desc")

  let data: any

  try {
    console.log("[v0] Fetching reviews from Google Business Profile API...")
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-GOOG-API-FORMAT-VERSION": "2",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      if (process.env.DEBUG_GOOGLE_REVIEWS === "true") {
        console.warn("[v0] Google Business Profile reviews error status:", response.status)
      }
      return null
    }

    data = await response.json()
  } catch (error) {
    console.error("[v0] Google Business Profile reviews request failed:", error)
    return null
  }

  if (!data) {
    return null
  }

  const reviews = (data.reviews || [])
    .map(mapGoogleBusinessProfileReview)
    .filter((review: GoogleReview) => review.text.trim().length > 0)
    .sort((a: GoogleReview, b: GoogleReview) => b.time - a.time)

  const result = {
    reviews,
    rating: Number(data.averageRating) || 0,
    totalReviews: Number(data.totalReviewCount) || 0,
  }

  if (result.reviews.length > 0) {
    console.log(`[v0] Loaded ${result.reviews.length} Google Business Profile reviews, sorted by newest`)
  }

  return result
}

interface GooglePlacesConfig {
  apiKey: string
  placeId: string
}

function getGooglePlacesConfig(): GooglePlacesConfig | null {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim()
  const placeId = process.env.GOOGLE_PLACES_ID?.trim()

  if (!apiKey || !placeId) {
    return null
  }

  return { apiKey, placeId }
}

function mapGooglePlacesReview(review: any): GoogleReview {
  return {
    author_name: typeof review.author_name === "string" ? review.author_name : "Anonymous",
    rating: googleBusinessProfileRatingToNumber(review.rating),
    text: typeof review.text === "string" ? review.text : "",
    time: Number(review.time) || 0,
    profile_photo_url: typeof review.profile_photo_url === "string" ? review.profile_photo_url : undefined,
  }
}

async function fetchGoogleReviewsFromPlaces(): Promise<GoogleReviewsData | null> {
  const config = getGooglePlacesConfig()

  if (!config) {
    return null
  }

  const url = new URL(GOOGLE_PLACES_DETAILS_URL)
  url.searchParams.set("place_id", config.placeId)
  url.searchParams.set("fields", "name,rating,user_ratings_total,reviews")
  url.searchParams.set("reviews_sort", "newest")
  url.searchParams.set("key", config.apiKey)

  let data: any

  try {
    console.log("[v0] Fetching reviews from Google Places API (fallback)...")
    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      if (process.env.DEBUG_GOOGLE_REVIEWS === "true") {
        console.warn("[v0] Google Places reviews error status:", response.status)
      }
      return null
    }

    data = await response.json()
  } catch (error) {
    console.error("[v0] Google Places reviews request failed:", error)
    return null
  }

  if (!data || data.status !== "OK" || !data.result) {
    if (process.env.DEBUG_GOOGLE_REVIEWS === "true") {
      console.warn("[v0] Google Places reviews status:", data?.status, data?.error_message)
    }
    return null
  }

  const result = data.result

  const reviews = (result.reviews || [])
    .map(mapGooglePlacesReview)
    .filter((review: GoogleReview) => review.text.trim().length > 0)
    .sort((a: GoogleReview, b: GoogleReview) => b.time - a.time)

  if (reviews.length > 0) {
    console.log(`[v0] Loaded ${reviews.length} Google Places reviews (fallback), sorted by newest`)
  }

  return {
    reviews,
    rating: Number(result.rating) || 0,
    totalReviews: Number(result.user_ratings_total) || 0,
    businessName: typeof result.name === "string" ? result.name : undefined,
  }
}

// Primary source is the Business Profile API (full review list once Google approves
// access). Until then, fall back to Place Details so the widget shows real reviews.
async function fetchGoogleReviews(): Promise<GoogleReviewsData | null> {
  const fromBusinessProfile = await fetchGoogleReviewsFromApi()

  if (fromBusinessProfile && fromBusinessProfile.reviews.length > 0) {
    return fromBusinessProfile
  }

  const fromPlaces = await fetchGoogleReviewsFromPlaces()

  if (fromPlaces) {
    return fromPlaces
  }

  return fromBusinessProfile
}

const getCachedGoogleReviews = unstable_cache(fetchGoogleReviews, ["google-reviews"], {
  revalidate: 3600,
  tags: ["google-reviews"],
})

export async function getGoogleReviews(): Promise<GoogleReviewsData | null> {
  try {
    return await getCachedGoogleReviews()
  } catch (error) {
    console.error("[v0] Error fetching reviews:", error)
    return null
  }
}
