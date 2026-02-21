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

    if (!apiKey || !placeId) {
      return NextResponse.json(
        { error: 'Missing Google Places API credentials' },
        { status: 400 }
      )
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=reviews,rating,user_ratings_total,name`

    const response = await fetch(url, { next: { revalidate: 3600 } })

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`)
    }

    const data: GooglePlaceDetails = await response.json()

    if (data.result.reviews) {
      return NextResponse.json({
        reviews: data.result.reviews.slice(0, 6), // Get top 6 reviews for carousel
        rating: data.result.rating || 0,
        totalReviews: data.result.user_ratings_total || 0,
        businessName: data.result.name,
      })
    }

    return NextResponse.json({
      reviews: [],
      rating: data.result.rating || 0,
      totalReviews: data.result.user_ratings_total || 0,
      businessName: data.result.name,
    })
  } catch (error) {
    console.error('Error fetching Google reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
