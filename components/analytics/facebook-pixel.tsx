"use client"

import type React from "react"
import { useEffect } from "react"

interface FacebookPixelProps {
  pixelId: string
}

const FacebookPixel: React.FC<FacebookPixelProps> = ({ pixelId }) => {
  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    !window.fbq
      ? (window.fbq = () => {
          ;(window.fbq.q = window.fbq.q || []).push(arguments)
        })
      : void 0
    // @ts-ignore
    window._fbq = window._fbq || []
    // @ts-ignore
    if (!window._fbq.loaded) {
      // @ts-ignore
      window._fbq.loaded = true
      window.fbq("init", pixelId)
      window.fbq("track", "PageView")

      const fbScript = document.createElement("script")
      fbScript.async = true
      fbScript.src = `https://connect.facebook.net/en_US/fbevents.js`
      document.head.appendChild(fbScript)
    }

    return () => {
      // Cleanup function (optional)
    }
  }, [pixelId])

  return null
}

export default FacebookPixel
