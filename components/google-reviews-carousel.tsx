'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Review {
  author_name: string
  rating: number
  text: string
  time: number
  profile_photo_url?: string
}

interface ReviewsData {
  reviews: Review[]
  rating: number
  totalReviews: number
  businessName?: string
}

export function GoogleReviewsCarousel() {
  const [reviews, setReviews] = useState<ReviewsData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/google-reviews')
        if (!response.ok) throw new Error('Failed to fetch reviews')
        const data = await response.json()
        setReviews(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [])

  if (isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="container px-4 mx-auto">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-8 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || !reviews || reviews.reviews.length === 0) {
    return null
  }

  const displayedReviews = reviews.reviews.slice(currentIndex, currentIndex + 3)
  const canGoNext = currentIndex + 3 < reviews.reviews.length
  const canGoPrev = currentIndex > 0

  const handlePrev = () => {
    if (canGoPrev) setCurrentIndex(currentIndex - 1)
  }

  const handleNext = () => {
    if (canGoNext) setCurrentIndex(currentIndex + 1)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ))
  }

  return (
    <section className="py-12 bg-gradient-to-b from-blue-50 to-white">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Google відгуки</h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex gap-1">{renderStars(Math.round(reviews.rating))}</div>
            <span className="font-semibold text-lg">{reviews.rating.toFixed(1)}</span>
            <span className="text-gray-600">({reviews.totalReviews} відгуків)</span>
          </div>
        </div>

        {/* Mobile Carousel View */}
        <div className="md:hidden">
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4 min-w-min px-4">
              {reviews.reviews.map((review, index) => (
                <ReviewCard key={index} review={review} renderStars={renderStars} />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Grid View with Navigation */}
        <div className="hidden md:block">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {displayedReviews.map((review, index) => (
              <ReviewCard
                key={currentIndex + index}
                review={review}
                renderStars={renderStars}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          {reviews.reviews.length > 3 && (
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="rounded-full"
              >
                <ChevronLeft size={20} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={!canGoNext}
                className="rounded-full"
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          )}
        </div>

        {/* Google Business Link */}
        <div className="text-center mt-8">
          <a
            href="https://www.google.com/maps/search/?api=1&query=devicehelp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            Дивитись все відгуки на Google Maps
            <ChevronRight size={18} />
          </a>
        </div>
      </div>

      {/* Schema.org markup for aggregate rating */}
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
    </section>
  )
}

function ReviewCard({
  review,
  renderStars,
}: {
  review: Review
  renderStars: (rating: number) => React.ReactNode
}) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Card className="flex-none w-full md:flex-1 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          {review.profile_photo_url && (
            <Image
              src={review.profile_photo_url}
              alt={review.author_name}
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{review.author_name}</h3>
            <p className="text-sm text-gray-500">{formatDate(review.time)}</p>
          </div>
        </div>

        <div className="flex gap-1 mb-3">{renderStars(review.rating)}</div>

        <p className="text-gray-700 text-sm line-clamp-4">{review.text}</p>
      </CardContent>
    </Card>
  )
}
