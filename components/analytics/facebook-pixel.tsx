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
      if (!window.fbq) {
        const fbq = (...args: any[]) => {
          if (fbq.callMethod) {
            fbq.callMethod.apply(fbq, args)
          } else {
            fbq.queue.push(args)
          }
        }
        fbq.push = fbq
        fbq.loaded = true
        fbq.version = "2.0"
        fbq.queue = []
        window.fbq = fbq
      }

      window.fbq("init", pixelId)
      window.fbq("track", "PageView")

      console.log("Facebook Pixel initialized with ID:", pixelId)
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
