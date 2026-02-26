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
      console.warn("[v0] Google Places API key or place ID not configured")
      return null
    }

    // Try multiple field combinations to get reviews
    // First try: All fields
    let url = `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,rating,userRatingCount,reviews&key=${apiKey}`

    console.log("[v0] Fetching from Google Places API...")
    let response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
      next: { revalidate: 3600 },
    })

    let data = await response.json()
    console.log("[v0] Google API Response (attempt 1) - has reviews:", !!data.reviews, "reviews count:", data.reviews?.length || 0)

    // If no reviews, try without key in URL (use header instead)
    if (!data.reviews || data.reviews.length === 0) {
      console.log("[v0] Trying alternative API request format...")
      url = `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,rating,userRatingCount,reviews`
      
      response = await fetch(url, {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 },
      })
      
      data = await response.json()
      console.log("[v0] Google API Response (attempt 2) - has reviews:", !!data.reviews, "reviews count:", data.reviews?.length || 0)
    }

    if (!response.ok) {
      console.error("[v0] Google API error status:", response.status, data)
      return null
    }

    if (!data) {
      return null
    }

    // Handle both new and legacy API responses
    const reviews = data.reviews || []
    
    if (reviews.length === 0) {
      console.warn("[v0] No reviews returned from Google API. Ensure you have:")
      console.warn("[v0] - Places API enabled in Google Cloud Console")
      console.warn("[v0] - 'Places API' product selected in your API key")
      console.warn("[v0] - Reviews are available for this business on Google")
      console.log("[v0] API Response structure:", {
        rating: data.rating,
        userRatingCount: data.userRatingCount,
        displayName: data.displayName?.text,
        reviewsAvailable: !!data.reviews,
      })
    }

    const result = {
      // Get ALL reviews and sort by newest first (highest timestamp first)
      reviews: reviews
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
