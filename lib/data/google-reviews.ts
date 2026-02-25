import { cache } from "react"
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

const getCachedGoogleReviews = unstable_cache(
  async (): Promise<GoogleReviewsData | null> => {
    try {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY
      const placeId = process.env.GOOGLE_PLACES_ID

      if (!apiKey || !placeId) {
        return null
      }

      // Use the new Places API endpoint instead of legacy API
      const url = `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,rating,userRatingCount,reviews&key=${apiKey}`

      const response = await fetch(url, {
        headers: {
          "X-Goog-Api-Key": apiKey,
        },
        next: { revalidate: 3600 },
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] Google API error status:", response.status)
        return null
      }

      if (!data) {
        return null
      }

      const result = {
        reviews: (data.reviews || []).slice(0, 6).map((review: any) => ({
          author_name: review.authorAttribution?.displayName || "Anonymous",
          rating: review.rating || 0,
          text: review.originalText?.text || (typeof review.text === 'object' ? review.text?.text : (review.text || "")),
          time: review.publishTime ? new Date(review.publishTime).getTime() / 1000 : 0,
          profile_photo_url: review.authorAttribution?.photoUri,
        })),
        rating: data.rating || 0,
        totalReviews: data.userRatingCount || 0,
        businessName: data.displayName?.text,
      }
      
      return result
    } catch (error) {
      console.error("[v0] Error fetching reviews:", error)
      return null
    }
  },
  ["google-reviews"],
  { revalidate: 3600, tags: ["google-reviews"] }
)

export const getGoogleReviews = cache(getCachedGoogleReviews)
