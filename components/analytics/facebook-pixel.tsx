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
      window.fbq = function fbq() {
        if (window.fbq.callMethod) {
          window.fbq.callMethod.apply(window.fbq, arguments)
        } else {
          window.fbq.queue.push(arguments)
        }
      }

      if (!window._fbq) {
        window._fbq = window.fbq
      }

      window.fbq.push = window.fbq
      window.fbq.loaded = true
      window.fbq.version = "2.0"
      window.fbq.queue = []

      // Ініціалізуємо pixel
      window.fbq("init", pixelId)
      window.fbq("track", "PageView")
    }
  }, [pixelId, consent])

  if (!consent || !pixelId) {
    return null
  }

  return (
    <>
      <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />
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
