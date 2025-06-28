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
      window.fbq.l = +new Date()
      window.fbq("init", pixelId)
      window.fbq("track", "PageView")
    }
  }, [pixelId, consent])

  if (!consent || !pixelId) {
    return null
  }

  return (
    <>
      <Script id="fb-pixel" strategy="afterInteractive" src="https://connect.facebook.net/en_US/fbevents.js" />
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
