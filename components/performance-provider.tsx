"use client"

import type React from "react"

import { useEffect } from "react"
import { usePerformanceMonitor } from "@/lib/performance-monitor"

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const { startMonitoring } = usePerformanceMonitor()

  useEffect(() => {
    // Start monitoring performance metrics
    startMonitoring()

    // Monitor page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Page is being hidden, good time to send final metrics
        console.log("[Performance] Page hidden, sending final metrics")
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Monitor connection changes
    const handleConnectionChange = () => {
      const connection = (navigator as any).connection
      if (connection) {
        console.log(`[Performance] Connection changed: ${connection.effectiveType}`)
      }
    }

    if ("connection" in navigator) {
      ;(navigator as any).connection.addEventListener("change", handleConnectionChange)
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if ("connection" in navigator) {
        ;(navigator as any).connection.removeEventListener("change", handleConnectionChange)
      }
    }
  }, [startMonitoring])

  return <>{children}</>
}
