"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ProgressiveLoaderProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function ProgressiveLoader({ children, delay = 100, className }: ProgressiveLoaderProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className,
      )}
    >
      {children}
    </div>
  )
}
