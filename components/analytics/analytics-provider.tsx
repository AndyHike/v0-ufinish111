"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/router"

interface AnalyticsProviderProps {
  children: ReactNode
  analyticsId: string
}

interface AnalyticsContextType {
  trackEvent: (eventName: string, eventParams?: { [key: string]: any }) => void
  trackPageView: (path: string) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

const useAnalytics = () => {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider")
  }
  return context
}

const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children, analyticsId }) => {
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!analyticsId) {
      console.error("Analytics ID is missing. Tracking will be disabled.")
      return
    }

    const loadAnalytics = async () => {
      try {
        // Dynamically import the analytics library
        const analytics = (await import("analytics")).default

        // Initialize the analytics instance
        const instance = analytics({
          app: "nextjs-ecommerce", // Replace with your app name
          plugins: [], // Add any plugins you need
        })

        // Load Google Analytics plugin if analyticsId is provided
        if (analyticsId) {
          const googleAnalytics = (await import("@analytics/google-analytics")).default
          instance.use(
            googleAnalytics({
              measurementIds: [analyticsId],
            }),
          )
        }

        // Set the initialized state
        setIsInitialized(true)

        // Track the initial page view
        trackPageView(router.asPath)

        // Subscribe to router events to track page views on navigation
        router.events.on("routeChangeComplete", trackPageView)

        // Clean up the event listener on unmount
        return () => {
          router.events.off("routeChangeComplete", trackPageView)
        }
      } catch (error: any) {
        console.error("Failed to initialize analytics:", error)
      }
    }

    loadAnalytics()
  }, [analyticsId, router])

  const trackEvent = (eventName: string, eventParams?: { [key: string]: any }) => {
    if (!isInitialized) {
      console.error("Analytics is not initialized. Event tracking is disabled.")
      return
    }

    try {
      window.analytics.track(eventName, eventParams)
    } catch (error: any) {
      console.error("Error tracking event:", error)
    }
  }

  const trackPageView = (path: string) => {
    if (!isInitialized) {
      console.error("Analytics is not initialized. Page view tracking is disabled.")
      return
    }

    try {
      window.analytics.page(path)
    } catch (error: any) {
      console.error("Error tracking page view:", error)
    }
  }

  return <AnalyticsContext.Provider value={{ trackEvent, trackPageView }}>{children}</AnalyticsContext.Provider>
}

export { AnalyticsProvider, useAnalytics }
