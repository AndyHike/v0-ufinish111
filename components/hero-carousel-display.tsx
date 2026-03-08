"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { CarouselData } from "@/types/hero-carousel"

export function HeroCarouselDisplay({
    fallbackImage,
    fallbackAlt,
    mobileTitle,
    initialData
}: {
    fallbackImage: string
    fallbackAlt: string
    mobileTitle: string
    initialData?: CarouselData | null
}) {
    const [data, setData] = useState<CarouselData | null>(initialData || null)
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        // Only fetch if initialData was not provided at all (is undefined).
        // If it's null, it means the server explicitly found no data.
        if (initialData !== undefined) return

        const fetchCarousel = async () => {
            try {
                const res = await fetch("/api/hero-carousel")
                if (res.ok) {
                    const json = await res.json()
                    setData(json)
                }
            } catch (error) {
                console.error("Failed to fetch hero carousel:", error)
            }
        }
        fetchCarousel()
    }, [initialData])

    const nextSlide = useCallback(() => {
        if (!data?.slides?.length) return
        setCurrentIndex((prev) => (prev === data.slides.length - 1 ? 0 : prev + 1))
    }, [data])

    const prevSlide = useCallback(() => {
        if (!data?.slides?.length) return
        setCurrentIndex((prev) => (prev === 0 ? data.slides.length - 1 : prev - 1))
    }, [data])

    useEffect(() => {
        if (!data?.enabled || !data?.slides?.length || data.slides.length < 2) return

        const intervalId = setInterval(nextSlide, data.autoplay_interval || 5000)
        return () => clearInterval(intervalId)
    }, [data, nextSlide])

    // If disabled or no slides, show fallback
    if (!data?.enabled || !data?.slides?.length) {
        return (
            <div className="relative w-full h-[250px] min-h-[250px] md:h-[350px] rounded-xl overflow-hidden shadow-lg bg-gray-50">
                <Image
                    src={fallbackImage}
                    alt={fallbackAlt}
                    fill
                    priority
                    fetchPriority="high"
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 450px"
                    quality={85}
                />
                <div className="md:hidden absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 flex items-end">
                    <h1 className="hero-title text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {mobileTitle}
                    </h1>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-[250px] min-h-[250px] md:h-[350px] rounded-xl overflow-hidden shadow-lg group bg-gray-50">
            {data.slides.map((slide, index) => (
                <a
                    key={slide.id}
                    href={slide.link || "#"}
                    target={slide.link?.startsWith("http") ? "_blank" : "_self"}
                    rel={slide.link?.startsWith("http") ? "noopener noreferrer" : undefined}
                    className={`absolute inset-0 transition-opacity duration-500 ease-in-out cursor-pointer ${index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                        }`}
                >
                    <Image
                        src={slide.image_url}
                        alt={`Slide ${index + 1}`}
                        fill
                        priority={index === 0}
                        className="object-cover object-center"
                        sizes="(max-width: 768px) 100vw, 450px"
                        quality={85}
                        unoptimized // Useful for external URLs
                    />
                </a>
            ))}

            {/* Navigation Arrows */}
            {data.slides.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.preventDefault(); prevSlide(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); nextSlide(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </>
            )}

            {/* Dots */}
            {data.slides.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                    {data.slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => { e.preventDefault(); setCurrentIndex(index); }}
                            className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? "bg-white" : "bg-white/50"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Mobile Title Overlay - kept visible on top of slides so design stays consistent */}
            <div className="md:hidden absolute z-30 inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 flex items-end pointer-events-none">
                <h1 className="hero-title text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {mobileTitle}
                </h1>
            </div>
        </div>
    )
}
