import { unstable_cache } from "next/cache"

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

async function fetchGoogleReviewsFromApi(): Promise<GoogleReviewsData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  const placeId = process.env.GOOGLE_PLACES_ID

  if (!apiKey || !placeId) {
    return null
  }

  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,rating,userRatingCount,reviews`

  console.log("[v0] Fetching all available reviews from Google Places API...")
  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    if (process.env.DEBUG_GOOGLE_REVIEWS === "true") {
      console.warn("[v0] Google API error status:", response.status)
    }
    throw new Error(`Google Places API returned ${response.status}`)
  }

  const data = await response.json()

  if (!data) {
    return null
  }

  const reviews = (data.reviews || [])
    .map((review: any) => ({
      author_name: review.authorAttribution?.displayName || "Anonymous",
      rating: review.rating || 0,
      text: review.originalText?.text || (typeof review.text === "object" ? review.text?.text : review.text || ""),
      time: review.publishTime ? new Date(review.publishTime).getTime() / 1000 : 0,
      profile_photo_url: review.authorAttribution?.photoUri,
    }))
    .sort((a: any, b: any) => b.time - a.time)

  const result = {
    reviews,
    rating: data.rating || 0,
    totalReviews: data.userRatingCount || 0,
    businessName: data.displayName?.text,
  }

  if (result.reviews.length > 0) {
    console.log(`[v0] Loaded ${result.reviews.length} reviews from Google, sorted by newest`)
  }

  return result
}

const getCachedGoogleReviews = unstable_cache(fetchGoogleReviewsFromApi, ["google-reviews"], {
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
