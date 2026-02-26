import { cache } from "react"

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

export const getGoogleReviews = cache(async (): Promise<GoogleReviewsData | null> => {
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
      console.error("[v0] Google API error status:", response.status, data)
      return null
    }

    if (!data) {
      return null
    }

    const result = {
      // Get ALL reviews and sort by newest first (highest timestamp first)
      reviews: (data.reviews || [])
        .map((review: any) => ({
          author_name: review.authorAttribution?.displayName || "Anonymous",
          rating: review.rating || 0,
          text: review.originalText?.text || (typeof review.text === 'object' ? review.text?.text : (review.text || "")),
          time: review.publishTime ? new Date(review.publishTime).getTime() / 1000 : 0,
          profile_photo_url: review.authorAttribution?.photoUri,
        }))
        .sort((a: any, b: any) => b.time - a.time), // Sort by time descending (newest first)
      rating: data.rating || 0,
      totalReviews: data.userRatingCount || 0,
      businessName: data.displayName?.text,
    }
    
    console.log("[v0] Returning reviews:", result.reviews.length, "sorted by newest first")
    return result
  } catch (error) {
    console.error("[v0] Error fetching reviews:", error)
    return null
  }
})
