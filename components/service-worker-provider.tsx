"use client"

import type React from "react"

import { useEffect } from "react"
import { useServiceWorker } from "@/lib/service-worker"

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const { register, preloadResources } = useServiceWorker()

  useEffect(() => {
    // Register service worker on mount
    register()

    // Preload critical resources
    const criticalResources = [
      "/focused-phone-fix.webp",
      "/abstract-geometric-shapes.png",
      "/_next/static/css/app/layout.css",
    ]

    preloadResources(criticalResources)

    // Check for updates periodically
    const updateInterval = setInterval(() => {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CHECK_UPDATE" })
      }
    }, 60000) // Check every minute

    return () => clearInterval(updateInterval)
  }, [register, preloadResources])

  return <>{children}</>
}
