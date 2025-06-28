"use client"

import { useEffect } from "react"
import Script from "next/script"

interface FacebookPixelProps {
  pixelId: string
  consent: boolean
}

declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: any
  }
}

export function FacebookPixel({ pixelId, consent }: FacebookPixelProps) {
  useEffect(() => {
    if (consent && pixelId && typeof window !== "undefined") {
      // Ініціалізуємо Facebook Pixel
      window.fbq =
        window.fbq ||
        ((...args: any[]) => {
          ;(window.fbq.q = window.fbq.q || []).push(args)
        })
      window._fbq = window._fbq || window.fbq
      window.fbq.push = window.fbq
      window.fbq.loaded = true
      window.fbq.version = "2.0"
      window.fbq.queue = []

      window.fbq("init", pixelId)
      window.fbq("track", "PageView")

      console.log("Facebook Pixel initialized with ID:", pixelId)
    }
  }, [pixelId, consent])

  if (!consent || !pixelId) {
    console.log("Facebook Pixel not loaded - consent:", consent, "pixelId:", pixelId)
    return null
  }

  return (
    <>
      <Script
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="afterInteractive"
        onLoad={() => console.log("Facebook Pixel script loaded successfully")}
        onError={() => console.error("Failed to load Facebook Pixel script")}
      />
    </>
  )
}
