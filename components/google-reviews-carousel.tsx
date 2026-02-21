'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'

interface Review {
  author_name: string
  rating: number
  text: string
  time: number
}

interface ReviewsData {
  reviews: Review[]
  rating: number
  totalReviews: number
  businessName?: string
}

export function GoogleReviewsCarousel() {
  const [reviews, setReviews] = useState<ReviewsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch('/api/google-reviews')
        if (res.ok) {
          const data = await res.json()
          if (data.reviews && data.reviews.length > 0) {
            setReviews(data)
          }
        }
      } catch (err) {
        console.error('[v0] Reviews error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [])

  if (isLoading) {
    return null
  }

  if (!reviews || reviews.reviews.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-white border-b">
      <div className="container px-4 mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2">Google відгуки</h2>
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={20}
                className={i < Math.round(reviews.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
          <span className="font-semibold">{reviews.rating.toFixed(1)}</span>
          <span className="text-gray-600">({reviews.totalReviews} відгуків)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.reviews.slice(0, 3).map((review, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold text-sm mb-1">{review.author_name}</h3>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-700 line-clamp-4">{review.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'AggregateRating',
              'ratingValue': reviews.rating.toFixed(1),
              'reviewCount': reviews.totalReviews,
              'bestRating': '5',
              'worstRating': '1',
            }),
          }}
        />
      </div>
    </section>
  )
}
