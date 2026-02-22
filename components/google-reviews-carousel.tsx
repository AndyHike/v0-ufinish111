"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GoogleReviewsData } from "@/lib/data/google-reviews"

interface GoogleReviewsCarouselProps {
  data: GoogleReviewsData
}

export function GoogleReviewsCarousel({ data }: GoogleReviewsCarouselProps) {
  const t = useTranslations("GoogleReviews")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const hasReviews = data && data.reviews.length > 0

  // Show 1 review on mobile, 3 on desktop
  const itemsPerPage = isMobile ? 1 : 3
  const displayedReviews = hasReviews ? data.reviews.slice(currentIndex, currentIndex + itemsPerPage) : []
  const canGoNext = currentIndex + itemsPerPage < (data?.reviews?.length || 0)
  const canGoPrev = currentIndex > 0
  const totalPages = Math.ceil((data?.reviews?.length || 0) / itemsPerPage)
  const currentPage = Math.floor(currentIndex / itemsPerPage) + 1

  const handlePrev = () => {
    if (canGoPrev) setCurrentIndex(Math.max(0, currentIndex - itemsPerPage))
  }

  const handleNext = () => {
    if (canGoNext) setCurrentIndex(currentIndex + itemsPerPage)
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

  const formatDate = (timestamp: number, locale: string) => {
    try {
      const localeMap: Record<string, string> = {
        uk: "uk-UA",
        en: "en-US",
        cs: "cs-CZ",
      }
      return new Date(timestamp * 1000).toLocaleDateString(localeMap[locale] || "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return t("unknownDate")
    }
  }

  const getCurrentLocale = (): string => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname
      const match = path.match(/^\/([a-z]{2})\//)
      if (match) return match[1]
    }
    return "en"
  }

  const currentLocale = getCurrentLocale()

  return (
    <section className="py-12 bg-white border-b">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t("title")}</h2>
          {hasReviews ? (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex gap-1">{renderStars(Math.round(data.rating))}</div>
              <span className="font-semibold text-lg">{data.rating.toFixed(1)}</span>
              <span className="text-gray-600">
                ({data.totalReviews} {t("reviews")})
              </span>
            </div>
          ) : (
            <div className="text-gray-500 mb-4">{t("noReviews")}</div>
          )}
        </div>

        {hasReviews ? (
          <>
            {/* Mobile Carousel View with Fixed Navigation */}
            <div className="md:hidden">
              <div className="relative">
                <div className="grid grid-cols-1 gap-6 mb-8">
                  {displayedReviews.map((review, index) => (
                    <ReviewCard
                      key={currentIndex + index}
                      review={review}
                      renderStars={renderStars}
                      formatDate={(ts) => formatDate(ts, currentLocale)}
                      t={t}
                      isMobile
                    />
                  ))}
                </div>

                {/* Mobile Navigation Buttons */}
                {data.reviews.length > 1 && (
                  <div className="flex justify-center gap-4 mb-6">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrev}
                      disabled={!canGoPrev}
                      className="rounded-full"
                    >
                      <ChevronLeft size={20} />
                      <span className="sr-only">{t("previous")}</span>
                    </Button>
                    <span className="flex items-center text-sm text-gray-500 px-4">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNext}
                      disabled={!canGoNext}
                      className="rounded-full"
                    >
                      <ChevronRight size={20} />
                      <span className="sr-only">{t("next")}</span>
                    </Button>
                  </div>
                )}
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
                    formatDate={(ts) => formatDate(ts, currentLocale)}
                    t={t}
                  />
                ))}
              </div>

              {/* Navigation Buttons */}
              {data.reviews.length > itemsPerPage && (
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrev}
                    disabled={!canGoPrev}
                    className="rounded-full"
                    title={t("previous")}
                  >
                    <ChevronLeft size={20} />
                    <span className="sr-only">{t("previous")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="rounded-full"
                    title={t("next")}
                  >
                    <ChevronRight size={20} />
                    <span className="sr-only">{t("next")}</span>
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">{t("loading")}</p>
          </div>
        )}

        {/* Google Business Link */}
        <div className="text-center mt-8">
          <a
            href="https://www.google.com/maps/search/?api=1&query=devicehelp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            {t("viewAllReviews")}
            <ChevronRight size={18} />
          </a>
        </div>
      </div>

      {/* Schema.org markup for aggregate rating */}
      {hasReviews && (
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
      )}
    </section>
  )
}

interface ReviewCardProps {
  review: any
  renderStars: (rating: number) => React.ReactNode
  formatDate: (ts: number) => string
  t: any
  isMobile?: boolean
}

function ReviewCard({ review, renderStars, formatDate, t, isMobile }: ReviewCardProps) {
  return (
    <Card
      className={`flex-none hover:shadow-lg transition-shadow ${
        isMobile ? "w-80 min-w-80 sm:w-96 sm:min-w-96" : "w-full md:flex-1"
      } h-full`}
    >
      <CardContent className="p-6 flex flex-col h-full">
        <div className="mb-4">
          <h3 className="font-semibold truncate text-sm">
            {review.author_name || t("unknownAuthor")}
          </h3>
          <p className="text-xs text-gray-500">{formatDate(review.time)}</p>
        </div>

        <div className="flex gap-1 mb-3">{renderStars(review.rating)}</div>

        <p className="text-gray-700 text-sm line-clamp-4 flex-1">{review.text}</p>
      </CardContent>
    </Card>
  )
}
