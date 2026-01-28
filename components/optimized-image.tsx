"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"

interface OptimizedImageProps {
  src: string
  webpSrc?: string | null
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
  quality?: number
  sizes?: string
  onError?: () => void
}

export function OptimizedImage({
  src,
  webpSrc,
  alt,
  width,
  height,
  className,
  fill,
  priority,
  quality = 75,
  sizes,
  onError,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src)
  const [supportsWebp, setSupportsWebp] = useState(true)

  useEffect(() => {
    // Check WebP support
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const webpSupport = canvas.toDataURL("image/webp") !== canvas.toDataURL("image/png")
    setSupportsWebp(webpSupport)

    // Set initial image
    if (webpSupport && webpSrc) {
      setImageSrc(webpSrc)
    } else {
      setImageSrc(src)
    }
  }, [src, webpSrc])

  const handleError = () => {
    // Fallback to original image if WebP fails
    if (imageSrc !== src) {
      setImageSrc(src)
    } else if (onError) {
      onError()
    }
  }

  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        priority={priority}
        quality={quality}
        sizes={sizes}
        className={className}
        onError={handleError}
      />
    )
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      quality={quality}
      sizes={sizes}
      className={className}
      onError={handleError}
    />
  )
}
