"use client"

import { useEffect } from "react"
import Script from "next/script"

interface FacebookPixelProps {
  pixelId?: string
}

export function FacebookPixel({ pixelId }: FacebookPixelProps) {
  useEffect(() => {
    if (pixelId && typeof window !== "undefined") {
      // Disable console logging for Facebook Pixel
      const originalConsoleLog = console.log
      const originalConsoleInfo = console.info

      // Filter out Facebook and ECOMMERCE logs
      console.log = (...args) => {
        const message = args.join(" ")
        if (!message.includes("[ECOMMERCE]") && !message.includes("Facebook")) {
          originalConsoleLog.apply(console, args)
        }
      }

      console.info = (...args) => {
        const message = args.join(" ")
        if (!message.includes("[ECOMMERCE]") && !message.includes("Facebook")) {
          originalConsoleInfo.apply(console, args)
        }
      }

      // Initialize Facebook Pixel
      window.fbq =
        window.fbq ||
        (() => {
          ;(window.fbq.q = window.fbq.q || []).push(arguments)
        })

      if (!window._fbq) window._fbq = window.fbq
      window.fbq.push = window.fbq
      window.fbq.loaded = true
      window.fbq.version = "2.0"
      window.fbq.queue = []

      window.fbq("init", pixelId)
      window.fbq("track", "PageView")
    }
  }, [pixelId])

  if (!pixelId) return null

  return (
    <Script id="facebook-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `}
    </Script>
  )
}

declare global {
  interface Window {
    fbq: any
    _fbq: any
  }
}
