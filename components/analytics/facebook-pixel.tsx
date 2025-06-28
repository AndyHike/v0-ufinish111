"use client"

import { useEffect } from "react"
import Script from "next/script"

interface FacebookPixelProps {
  pixelId: string
}

export function FacebookPixel({ pixelId }: FacebookPixelProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && pixelId) {
      // Initialize Facebook Pixel
      window.fbq =
        window.fbq ||
        ((...args: any[]) => {
          ;(window.fbq.q = window.fbq.q || []).push(args)
        })
      window.fbq.l = +new Date()
      window.fbq("init", pixelId)
      window.fbq("track", "PageView")
    }
  }, [pixelId])

  if (!pixelId) return null

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive" src="https://connect.facebook.net/en_US/fbevents.js" />
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
