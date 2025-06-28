"use client"

import { useEffect } from "react"
import Script from "next/script"

interface GoogleAnalyticsProps {
  measurementId?: string
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    if (measurementId && typeof window !== "undefined") {
      // Disable console logging for GA
      const originalConsoleLog = console.log
      const originalConsoleInfo = console.info

      // Override console methods to filter out ECOMMERCE logs
      console.log = (...args) => {
        const message = args.join(" ")
        if (!message.includes("[ECOMMERCE]")) {
          originalConsoleLog.apply(console, args)
        }
      }

      console.info = (...args) => {
        const message = args.join(" ")
        if (!message.includes("[ECOMMERCE]")) {
          originalConsoleInfo.apply(console, args)
        }
      }

      // Configure gtag
      window.gtag =
        window.gtag ||
        (() => {
          ;(window.dataLayer = window.dataLayer || []).push(arguments)
        })

      window.gtag("js", new Date())
      window.gtag("config", measurementId, {
        debug_mode: false,
        send_page_view: false,
      })
    }
  }, [measurementId])

  if (!measurementId) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            debug_mode: false,
            send_page_view: false
          });
        `}
      </Script>
    </>
  )
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}
