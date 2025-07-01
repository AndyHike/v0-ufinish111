"use client"

import type React from "react"

import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface LazySectionProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function LazySection({ children, fallback, className }: LazySectionProps) {
  const defaultFallback = (
    <div className={`animate-pulse ${className || ""}`}>
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </div>
  )

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>
}
