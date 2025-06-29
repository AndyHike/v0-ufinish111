"use client"

import { useEffect } from "react"

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
        // Use the exact Facebook Pixel code provided
        !((f: any, b: any, e: any, v: any, n: any, t: any, s: any) => {
          if (f.fbq) return
          n = f.fbq = () => {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
          }
          if (!f._fbq) f._fbq = n
          n.push = n
          n.loaded = !0
          n.version = "2.0"
          n.queue = []
          t = b.createElement(e)
          t.async = !0
          t.src = v
          s = b.getElementsByTagName(e)[0]
          s.parentNode.insertBefore(t, s)
        })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")

        // Initialize with your specific Pixel ID
        window.fbq("init", pixelId)
        window.fbq("track", "PageView")
      }
    } else {
      console.log("Facebook Pixel not loaded - consent:", consent, "pixelId:", pixelId)
    }
  }, [pixelId, consent])

  // Clear Facebook Pixel when consent is revoked
  useEffect(() => {
    if (!consent && typeof window !== "undefined" && window.fbq) {
      // Clear Facebook Pixel data
      try {
        // Remove Facebook cookies
        const fbCookies = ["_fbp", "_fbc", "fr"]
        fbCookies.forEach((cookieName) => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
        })
      } catch (error) {
        console.warn("Could not clear Facebook cookies:", error)
      }
    }
  }, [consent])

  if (!consent || !pixelId) {
    return null
  }

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  )
}
