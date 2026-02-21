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

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=reviews,rating,user_ratings_total,name`

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    })

    const data = await response.json()
    console.log("[v0] Google API Full Response:", JSON.stringify(data, null, 2))

    if (!response.ok || data.status !== "OK") {
      console.error("[v0] Google API error status:", data.status)
      return null
    }

    if (!data.result) {
      return null
    }

    const result = {
      reviews: data.result.reviews?.slice(0, 6) || [],
      rating: data.result.rating || 0,
      totalReviews: data.result.user_ratings_total || 0,
      businessName: data.result.name,
    }
    
    console.log("[v0] Returning reviews:", result.reviews.length)
    return result
  } catch (error) {
    console.error("[v0] Error fetching reviews:", error)
    return null
  }
})
