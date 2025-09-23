"use client"

import { useEffect, useState } from "react"
import { usePerformanceMonitor, type PerformanceMetrics } from "@/lib/performance-monitor"

export function PerformanceDebug() {
  const { getMetrics } = usePerformanceMonitor()
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== "development") return

    const interval = setInterval(() => {
      setMetrics(getMetrics())
    }, 1000)

    // Toggle visibility with keyboard shortcut
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        setIsVisible(!isVisible)
      }
    }

    window.addEventListener("keydown", handleKeyPress)

    return () => {
      clearInterval(interval)
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [getMetrics, isVisible])

  if (process.env.NODE_ENV !== "development" || !isVisible) {
    return null
  }

  const getRatingColor = (value: number | undefined, thresholds: [number, number]) => {
    if (!value) return "text-gray-400"
    if (value <= thresholds[0]) return "text-green-600"
    if (value <= thresholds[1]) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Performance Metrics</h3>
        <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">
          ×
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>LCP:</span>
          <span className={getRatingColor(metrics.lcp, [2500, 4000])}>
            {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : "N/A"}
          </span>
        </div>

        <div className="flex justify-between">
          <span>FID:</span>
          <span className={getRatingColor(metrics.fid, [100, 300])}>
            {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : "N/A"}
          </span>
        </div>

        <div className="flex justify-between">
          <span>CLS:</span>
          <span className={getRatingColor(metrics.cls, [0.1, 0.25])}>
            {metrics.cls ? metrics.cls.toFixed(3) : "N/A"}
          </span>
        </div>

        <div className="flex justify-between">
          <span>FCP:</span>
          <span className={getRatingColor(metrics.fcp, [1800, 3000])}>
            {metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : "N/A"}
          </span>
        </div>

        <div className="flex justify-between">
          <span>TTFB:</span>
          <span className={getRatingColor(metrics.ttfb, [800, 1800])}>
            {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : "N/A"}
          </span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-600 text-gray-400">Press Ctrl+Shift+P to toggle</div>
    </div>
  )
}
