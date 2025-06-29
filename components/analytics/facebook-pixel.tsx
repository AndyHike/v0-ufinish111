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
    if (consent && pixelId) {
      console.log(`Facebook Pixel initialized with ID: ${pixelId}`)

      if (typeof window !== "undefined") {
        // Ініціалізуємо Facebook Pixel
        window.fbq =
          window.fbq ||
          (() => {
            ;(window.fbq.q = window.fbq.q || []).push(arguments)
          })
        window.fbq.l = +new Date()
        window.fbq("init", pixelId)
        window.fbq("track", "PageView")
      }
    } else {
      console.log("Facebook Pixel not loaded - consent:", consent, "pixelId:", pixelId)
    }
  }, [pixelId, consent])

  if (!consent || !pixelId) {
    return null
  }

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        src="https://connect.facebook.net/en_US/fbevents.js"
        onLoad={() => {
          console.log("Facebook Pixel script loaded")
        }}
        onError={(e) => {
          console.error("Failed to load Facebook Pixel script:", e)
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
