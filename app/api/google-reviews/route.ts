import { NextResponse } from 'next/server'

interface GoogleReview {
  author_name: string
  rating: number
  text: string
  time: number
  profile_photo_url?: string
}

interface GooglePlaceDetails {
  result: {
    reviews?: GoogleReview[]
    rating?: number
    user_ratings_total?: number
    name?: string
  }
}

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    const placeId = process.env.GOOGLE_PLACES_ID

    console.log('[v0] Google Reviews API - Checking credentials...')
    console.log('[v0] API Key available:', !!apiKey)
    console.log('[v0] Place ID available:', !!placeId)

    if (!apiKey || !placeId) {
      console.error('[v0] Missing Google Places credentials')
      return NextResponse.json(
        { error: 'Missing Google Places API credentials', reviews: [] },
        { status: 200 } // Return 200 with empty reviews instead of error
      )
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=reviews,rating,user_ratings_total,name`

    console.log('[v0] Fetching from Google Places API...')
    const response = await fetch(url)

    const data: GooglePlaceDetails = await response.json()

    console.log('[v0] Google API Response:', {
      hasReviews: !!data.result.reviews,
      reviewCount: data.result.reviews?.length || 0,
      rating: data.result.rating,
    })

    if (!response.ok) {
      console.error('[v0] Google API error:', data)
      return NextResponse.json(
        { error: 'Failed to fetch reviews', reviews: [], rating: 0, totalReviews: 0 },
        { status: 200 } // Return 200 with empty reviews instead of error
      )
    }

    const result = {
      reviews: data.result.reviews?.slice(0, 6) || [],
      rating: data.result.rating || 0,
      totalReviews: data.result.user_ratings_total || 0,
      businessName: data.result.name,
    }

    console.log('[v0] Returning reviews:', result.reviews.length)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] Error fetching Google reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews', reviews: [], rating: 0, totalReviews: 0 },
      { status: 200 } // Return 200 with empty reviews instead of error
    )
  }
}
