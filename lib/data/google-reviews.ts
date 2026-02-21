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
    console.log("[v0] getGoogleReviews called")
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    const placeId = process.env.GOOGLE_PLACES_ID

    console.log("[v0] Google credentials check - API Key:", !!apiKey, "Place ID:", !!placeId)

    if (!apiKey || !placeId) {
      console.log("[v0] Missing Google Places credentials - returning null")
      return null
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=reviews,rating,user_ratings_total,name`
    console.log("[v0] Fetching from Google API...")

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    })

    console.log("[v0] Google API response status:", response.status)

    if (!response.ok) {
      console.error("[v0] Google API error:", response.status)
      return null
    }

    const data = await response.json()
    console.log("[v0] FULL Google API response:", JSON.stringify(data, null, 2))
    console.log("[v0] Google API data received, reviews count:", data.result?.reviews?.length || 0)

    if (!data.result) {
      console.log("[v0] No result in Google API response")
      return null
    }

    const result = {
      reviews: data.result.reviews?.slice(0, 6) || [],
      rating: data.result.rating || 0,
      totalReviews: data.result.user_ratings_total || 0,
      businessName: data.result.name,
    }
    
    console.log("[v0] Returning Google reviews:", result)
    return result
  } catch (error) {
    console.error("[v0] Error fetching Google reviews:", error)
    return null
  }
})
