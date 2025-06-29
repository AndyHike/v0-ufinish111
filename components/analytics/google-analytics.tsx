"use client"

import type React from "react"
import { useEffect } from "react"
import ReactGA from "react-ga4"

interface GoogleAnalyticsProps {
  trackingId: string
}

const GoogleAnalytics: React.FC<GoogleAnalyticsProps> = ({ trackingId }) => {
  useEffect(() => {
    if (!trackingId) {
      console.error("Google Analytics tracking ID is missing. Ensure TRACKING_ID is set in your environment variables.")
      return
    }

    try {
      ReactGA.initialize(trackingId)
    } catch (error) {
      console.error("Error initializing Google Analytics:", error)
      return
    }

    ReactGA.send({ hitType: "pageview", page: window.location.pathname, title: document.title })

    const handleRouteChange = () => {
      ReactGA.send({ hitType: "pageview", page: window.location.pathname, title: document.title })
    }

    // Subscribe to route changes (example using window.addEventListener - adapt to your routing library)
    window.addEventListener("popstate", handleRouteChange)

    return () => {
      window.removeEventListener("popstate", handleRouteChange)
    }
  }, [trackingId])

  return null
}

export default GoogleAnalytics
