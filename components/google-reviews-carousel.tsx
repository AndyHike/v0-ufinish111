"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GoogleReviewsData } from "@/lib/data/google-reviews"

interface GoogleReviewsCarouselProps {
  data: GoogleReviewsData
}

export function GoogleReviewsCarousel({ data }: GoogleReviewsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!data || data.reviews.length === 0) {
    return null
  }

  const displayedReviews = data.reviews.slice(currentIndex, currentIndex + 3)
  const canGoNext = currentIndex + 3 < data.reviews.length
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
        className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
      />
    ))
  }

  const formatDate = (timestamp: number) => {
    try {
      return new Date(timestamp * 1000).toLocaleDateString("uk-UA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "невідома дата"
    }
  }

  return (
    <section className="py-12 bg-white border-b">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Google відгуки</h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex gap-1">{renderStars(Math.round(data.rating))}</div>
            <span className="font-semibold text-lg">{data.rating.toFixed(1)}</span>
            <span className="text-gray-600">({data.totalReviews} відгуків)</span>
          </div>
        </div>

        {/* Mobile Carousel View */}
        <div className="md:hidden overflow-x-auto pb-4">
          <div className="flex gap-4 px-4 min-w-min">
            {data.reviews.map((review, index) => (
              <ReviewCard
                key={index}
                review={review}
                renderStars={renderStars}
                formatDate={formatDate}
              />
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
                formatDate={formatDate}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          {data.reviews.length > 3 && (
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
            "@context": "https://schema.org",
            "@type": "AggregateRating",
            ratingValue: data.rating.toFixed(1),
            reviewCount: data.totalReviews,
            bestRating: "5",
            worstRating: "1",
          }),
        }}
      />
    </section>
  )
}

function ReviewCard({
  review,
  renderStars,
  formatDate,
}: {
  review: any
  renderStars: (rating: number) => React.ReactNode
  formatDate: (timestamp: number) => string
}) {
  return (
    <Card className="flex-none w-full md:flex-1 hover:shadow-lg transition-shadow">
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
