'use client'

import { useEffect, useState } from 'react'
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
  error?: string
}

export function GoogleReviewsCarousel() {
  const [reviews, setReviews] = useState<ReviewsData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchReviews = async () => {
      try {
        console.log('[v0] Carousel: Starting fetch...')
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

        const response = await fetch('/api/google-reviews', {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        console.log('[v0] Carousel: Data received', {
          hasReviews: Array.isArray(data.reviews),
          reviewCount: data.reviews?.length || 0,
          hasError: !!data.error,
        })

        if (!isMounted) return

        if (Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews(data)
          setError(null)
        } else {
          setError('Немає доступних відгуків')
          setReviews(null)
        }
      } catch (err) {
        console.error('[v0] Carousel: Error:', err)
        if (!isMounted) return
        
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Помилка завантаження відгуків (timeout)')
        } else {
          setError(err instanceof Error ? err.message : 'Помилка завантаження')
        }
        setReviews(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchReviews()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <section className="py-12 bg-white border-b">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4 animate-pulse"></div>
            <div className="flex justify-center gap-2 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="h-6 bg-gray-200 rounded w-40 mx-auto animate-pulse"></div>
          </div>
          <div className="hidden md:grid grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="md:hidden">
            <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
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
    <section className="py-12 bg-white border-b">
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
        <div className="md:hidden overflow-x-auto">
          <div className="flex gap-4 pb-4 px-4 min-w-min">
            {reviews.reviews.map((review, index) => (
              <ReviewCard key={index} review={review} renderStars={renderStars} />
            ))}
          </div>
        </div>

        {/* Desktop Grid View with Navigation */}
        <div className="hidden md:block">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
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
    try {
      return new Date(timestamp * 1000).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return 'невідома дата'
    }
  }

  return (
    <Card className="flex-none w-full md:flex-1 h-full hover:shadow-lg transition-shadow">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="mb-4">
          <h3 className="font-semibold truncate text-sm">{review.author_name}</h3>
          <p className="text-xs text-gray-500">{formatDate(review.time)}</p>
        </div>

        <div className="flex gap-1 mb-3">{renderStars(review.rating)}</div>

        <p className="text-gray-700 text-sm line-clamp-4 flex-1">{review.text}</p>
      </CardContent>
    </Card>
  )
}
