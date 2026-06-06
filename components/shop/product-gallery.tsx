"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const displayImages = images.length > 0 ? images : ["/tech-fix-storefront.png"]
  const [activeIndex, setActiveIndex] = useState(0)

  // Reset to the first image when the image set changes (e.g. variant switch).
  useEffect(() => {
    setActiveIndex(0)
  }, [images])

  const activeImage = displayImages[activeIndex] ?? displayImages[0]

  return (
    <div className="flex flex-col gap-3">
      {/* Square on small screens (scales with width), fixed height on desktop so
          the gallery has a clean, predictable size regardless of the info column. */}
      <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 lg:aspect-auto lg:h-[460px]">
        <Image
          src={activeImage}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 460px"
          className="object-cover"
        />
      </div>
      {displayImages.length > 1 ? (
        <div className="grid shrink-0 grid-cols-5 gap-3">
          {displayImages.slice(0, 5).map((image, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={image}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`${title} — ${index + 1}`}
                aria-current={isActive}
                className={`relative aspect-square overflow-hidden rounded-md border bg-gray-100 transition ${
                  isActive ? "border-gray-950 ring-1 ring-gray-950" : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <Image src={image} alt="" fill sizes="120px" className="object-cover" />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
