"use client"

// Mobile-specific optimizations utility
export class MobileOptimizations {
  private static instance: MobileOptimizations
  private isInitialized = false

  private constructor() {}

  static getInstance(): MobileOptimizations {
    if (!MobileOptimizations.instance) {
      MobileOptimizations.instance = new MobileOptimizations()
    }
    return MobileOptimizations.instance
  }

  init(): void {
    if (typeof window === "undefined" || this.isInitialized) return

    this.optimizeScrolling()
    this.optimizeTouchEvents()
    this.optimizeViewport()
    this.preloadCriticalResources()
    this.setupIntersectionObserver()

    this.isInitialized = true
  }

  private optimizeScrolling(): void {
    // Optimize scroll performance on mobile
    document.body.style.webkitOverflowScrolling = "touch"
    document.body.style.overscrollBehavior = "contain"

    // Passive event listeners for better scroll performance
    let ticking = false
    const updateScrollPosition = () => {
      // Update scroll-dependent elements
      ticking = false
    }

    const requestScrollUpdate = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition)
        ticking = true
      }
    }

    window.addEventListener("scroll", requestScrollUpdate, { passive: true })
  }

  private optimizeTouchEvents(): void {
    // Optimize touch events for better responsiveness
    document.addEventListener("touchstart", () => {}, { passive: true })
    document.addEventListener("touchmove", () => {}, { passive: true })
    document.addEventListener("touchend", () => {}, { passive: true })

    // Prevent zoom on double tap for better UX
    let lastTouchEnd = 0
    document.addEventListener(
      "touchend",
      (event) => {
        const now = new Date().getTime()
        if (now - lastTouchEnd <= 300) {
          event.preventDefault()
        }
        lastTouchEnd = now
      },
      false,
    )
  }

  private optimizeViewport(): void {
    // Optimize viewport for mobile devices
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute("content", "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no")
    }

    // Handle orientation changes
    window.addEventListener("orientationchange", () => {
      // Small delay to ensure proper rendering after orientation change
      setTimeout(() => {
        window.scrollTo(0, 0)
      }, 100)
    })
  }

  private preloadCriticalResources(): void {
    // Preload critical resources for faster loading
    const criticalResources = ["/focused-phone-fix.webp", "/abstract-geometric-shapes.png"]

    criticalResources.forEach((resource) => {
      const link = document.createElement("link")
      link.rel = "prefetch"
      link.href = resource
      document.head.appendChild(link)
    })
  }

  private setupIntersectionObserver(): void {
    // Setup intersection observer for lazy loading
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.classList.remove("loading-skeleton")
              imageObserver.unobserve(img)
            }
          }
        })
      },
      {
        rootMargin: "50px 0px",
        threshold: 0.1,
      },
    )

    // Observe all images with data-src attribute
    document.querySelectorAll("img[data-src]").forEach((img) => {
      imageObserver.observe(img)
    })
  }

  // Check if device is mobile
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Get connection information
  getConnectionInfo(): { effectiveType: string; downlink?: number } {
    const connection = (navigator as any).connection
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
      }
    }
    return { effectiveType: "unknown" }
  }

  // Optimize images based on connection
  optimizeForConnection(): void {
    const connection = this.getConnectionInfo()
    const isSlowConnection = connection.effectiveType === "2g" || connection.effectiveType === "slow-2g"

    if (isSlowConnection) {
      // Reduce image quality for slow connections
      document.documentElement.classList.add("slow-connection")
    }
  }
}

export const mobileOptimizations = MobileOptimizations.getInstance()

// Hook for React components
export function useMobileOptimizations() {
  const init = () => mobileOptimizations.init()
  const isMobile = () => mobileOptimizations.isMobile()
  const getConnectionInfo = () => mobileOptimizations.getConnectionInfo()
  const optimizeForConnection = () => mobileOptimizations.optimizeForConnection()

  return {
    init,
    isMobile,
    getConnectionInfo,
    optimizeForConnection,
  }
}
