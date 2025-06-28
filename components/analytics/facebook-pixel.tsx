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
    if (!consent || !pixelId) return

    // Перевіряємо чи вже завантажений Facebook Pixel
    const existingScript = document.querySelector('script[src*="connect.facebook.net"]')

    if (!existingScript) {
      // Ініціалізуємо fbq
      window.fbq =
        window.fbq ||
        (() => {
          ;(window.fbq.q = window.fbq.q || []).push(arguments)
        })
      window._fbq = window._fbq || window.fbq
      window.fbq.push = window.fbq
      window.fbq.loaded = true
      window.fbq.version = "2.0"
      window.fbq.queue = []

      // Створюємо та додаємо скрипт
      const script = document.createElement("script")
      script.src = "https://connect.facebook.net/en_US/fbevents.js"
      script.async = true

      script.onload = () => {
        window.fbq("init", pixelId)
        window.fbq("track", "PageView")
      }

      document.head.appendChild(script)
    } else if (window.fbq) {
      // Якщо скрипт вже завантажений, просто відправляємо PageView
      window.fbq("track", "PageView")
    }
  }, [pixelId, consent])

  // Відправляємо PageView при зміні consent з false на true
  useEffect(() => {
    if (consent && window.fbq) {
      window.fbq("track", "PageView")
    }
  }, [consent])

  return null
}
