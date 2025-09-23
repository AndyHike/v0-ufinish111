"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface LazyLoadWrapperProps {
  children: React.ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
  fallback?: React.ReactNode
}

export function LazyLoadWrapper({
  children,
  className = "",
  threshold = 0.1,
  rootMargin = "50px",
  fallback,
}: LazyLoadWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin,
      },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin, hasLoaded])

  return (
    <div ref={ref} className={`lazy-load ${isVisible ? "loaded" : ""} ${className}`}>
      {isVisible ? children : fallback || <div className="loading-skeleton h-32 w-full rounded" />}
    </div>
  )
}
