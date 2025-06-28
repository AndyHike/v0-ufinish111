"use client"

import { useEffect } from "react"
import Script from "next/script"

interface GoogleAnalyticsProps {
  measurementId: string
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && measurementId) {
      // Initialize dataLayer
      window.dataLayer = window.dataLayer || []

      // Define gtag function
      function gtag(...args: any[]) {
        window.dataLayer.push(args)
      }

      // Make gtag available globally
      window.gtag = gtag

      // Initialize GA4
      gtag("js", new Date())
      gtag("config", measurementId, {
        page_title: document.title,
        page_location: window.location.href,
      })
    }
  }, [measurementId])

  if (!measurementId) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
    </>
  )
}
