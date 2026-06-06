"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export interface ShopHeroSlide {
  title: string
  text: string
  action: string
  href: string
  image: string
}

const AUTOPLAY_INTERVAL_MS = 6000

export function ShopHeroCarousel({
  slides,
  eyebrow,
  ariaLabel,
}: {
  slides: ShopHeroSlide[]
  eyebrow: string
  ariaLabel: string
}) {
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const slideCount = slides.length

  const goTo = useCallback(
    (next: number) => {
      setIndex((current) => {
        if (slideCount === 0) {
          return current
        }
        return (next + slideCount) % slideCount
      })
    },
    [slideCount],
  )

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const previous = useCallback(() => goTo(index - 1), [goTo, index])

  // Respect users who prefer reduced motion: do not autoplay for them.
  const prefersReducedMotion = useRef(false)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return
    }
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  useEffect(() => {
    if (isPaused || slideCount <= 1 || prefersReducedMotion.current) {
      return
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slideCount)
    }, AUTOPLAY_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [isPaused, slideCount])

  if (slideCount === 0) {
    return null
  }

  return (
    <div
      className="relative min-h-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 md:min-h-[440px]"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      {slides.map((slide, slideIndex) => {
        const isActive = slideIndex === index

        return (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              isActive ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={!isActive}
            role="group"
            aria-roledescription="slide"
            aria-label={`${slideIndex + 1} / ${slideCount}`}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={slideIndex === 0}
              sizes="(max-width: 1024px) 100vw, 720px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-950/45 to-gray-950/10" />

            <div className="relative flex h-full min-h-[320px] flex-col justify-end p-6 md:min-h-[440px] md:p-9">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/70">{eyebrow}</p>
              <h2 className="mt-3 max-w-md text-2xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
                {slide.title}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/85 md:text-base">{slide.text}</p>
              <div className="mt-6">
                <Button asChild size="lg" variant="secondary">
                  <Link href={slide.href} tabIndex={isActive ? 0 : -1}>
                    {slide.action}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )
      })}

      {slideCount > 1 ? (
        <>
          <button
            type="button"
            onClick={previous}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 md:inline-flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 md:inline-flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-5 left-6 flex items-center gap-2 md:left-9">
            {slides.map((slide, slideIndex) => {
              const isActive = slideIndex === index
              return (
                <button
                  key={slide.title}
                  type="button"
                  onClick={() => goTo(slideIndex)}
                  aria-label={`Go to slide ${slideIndex + 1}`}
                  aria-current={isActive}
                  className={`h-1.5 rounded-full transition-all ${
                    isActive ? "w-7 bg-white" : "w-2.5 bg-white/45 hover:bg-white/70"
                  }`}
                />
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
