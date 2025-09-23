"use client"

// Core Web Vitals and performance monitoring
export interface PerformanceMetrics {
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
  inp?: number // Interaction to Next Paint
}

export interface PerformanceEntry {
  name: string
  value: number
  rating: "good" | "needs-improvement" | "poor"
  timestamp: number
  url: string
  userAgent: string
  connection?: string
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []
  private isMonitoring = false

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startMonitoring(): void {
    if (typeof window === "undefined" || this.isMonitoring) return

    this.isMonitoring = true
    this.observeLCP()
    this.observeFID()
    this.observeCLS()
    this.observeFCP()
    this.observeTTFB()
    this.observeINP()
    this.observeResourceTiming()
  }

  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any

        if (lastEntry) {
          this.metrics.lcp = lastEntry.startTime
          this.reportMetric("LCP", lastEntry.startTime, this.getLCPRating(lastEntry.startTime))
        }
      })

      observer.observe({ type: "largest-contentful-paint", buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn("LCP observation not supported:", error)
    }
  }

  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            const fid = entry.processingStart - entry.startTime
            this.metrics.fid = fid
            this.reportMetric("FID", fid, this.getFIDRating(fid))
          }
        })
      })

      observer.observe({ type: "first-input", buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn("FID observation not supported:", error)
    }
  }

  private observeCLS(): void {
    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })

        this.metrics.cls = clsValue
        this.reportMetric("CLS", clsValue, this.getCLSRating(clsValue))
      })

      observer.observe({ type: "layout-shift", buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn("CLS observation not supported:", error)
    }
  }

  private observeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.name === "first-contentful-paint") {
            this.metrics.fcp = entry.startTime
            this.reportMetric("FCP", entry.startTime, this.getFCPRating(entry.startTime))
          }
        })
      })

      observer.observe({ type: "paint", buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn("FCP observation not supported:", error)
    }
  }

  private observeTTFB(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.responseStart && entry.requestStart) {
            const ttfb = entry.responseStart - entry.requestStart
            this.metrics.ttfb = ttfb
            this.reportMetric("TTFB", ttfb, this.getTTFBRating(ttfb))
          }
        })
      })

      observer.observe({ type: "navigation", buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn("TTFB observation not supported:", error)
    }
  }

  private observeINP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.processingEnd && entry.startTime) {
            const inp = entry.processingEnd - entry.startTime
            this.metrics.inp = inp
            this.reportMetric("INP", inp, this.getINPRating(inp))
          }
        })
      })

      observer.observe({ type: "event", buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn("INP observation not supported:", error)
    }
  }

  private observeResourceTiming(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          // Monitor slow resources
          if (entry.duration > 1000) {
            console.warn(`Slow resource detected: ${entry.name} took ${entry.duration}ms`)
          }
        })
      })

      observer.observe({ type: "resource", buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn("Resource timing observation not supported:", error)
    }
  }

  private reportMetric(name: string, value: number, rating: "good" | "needs-improvement" | "poor"): void {
    const entry: PerformanceEntry = {
      name,
      value,
      rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType || "unknown",
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms (${rating})`)
    }

    // Send to analytics (implement your preferred analytics service)
    this.sendToAnalytics(entry)
  }

  private sendToAnalytics(entry: PerformanceEntry): void {
    // Example: Send to Google Analytics 4
    if (typeof window.gtag !== "undefined") {
      window.gtag("event", "web_vitals", {
        event_category: "Performance",
        event_label: entry.name,
        value: Math.round(entry.value),
        custom_map: {
          metric_rating: entry.rating,
          metric_value: entry.value,
        },
      })
    }

    // Example: Send to custom analytics endpoint
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/performance", JSON.stringify(entry))
    }
  }

  // Rating functions based on Core Web Vitals thresholds
  private getLCPRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 2500) return "good"
    if (value <= 4000) return "needs-improvement"
    return "poor"
  }

  private getFIDRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 100) return "good"
    if (value <= 300) return "needs-improvement"
    return "poor"
  }

  private getCLSRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 0.1) return "good"
    if (value <= 0.25) return "needs-improvement"
    return "poor"
  }

  private getFCPRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 1800) return "good"
    if (value <= 3000) return "needs-improvement"
    return "poor"
  }

  private getTTFBRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 800) return "good"
    if (value <= 1800) return "needs-improvement"
    return "poor"
  }

  private getINPRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 200) return "good"
    if (value <= 500) return "needs-improvement"
    return "poor"
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  stopMonitoring(): void {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
    this.isMonitoring = false
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// Hook for React components
export function usePerformanceMonitor() {
  const startMonitoring = () => performanceMonitor.startMonitoring()
  const stopMonitoring = () => performanceMonitor.stopMonitoring()
  const getMetrics = () => performanceMonitor.getMetrics()

  return {
    startMonitoring,
    stopMonitoring,
    getMetrics,
  }
}
