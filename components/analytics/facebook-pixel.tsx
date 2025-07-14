"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

interface FacebookPixelProps {
  pixelId: string
  consent: boolean
}

declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: any
    testFacebookPixel: () => void
    trackServiceClick: (serviceName: string, modelName: string, price: number) => void
    trackContactSubmission: (formData: any) => void
    trackContactClick: (method: string, location: string) => void
  }
}

export function FacebookPixel({ pixelId, consent }: FacebookPixelProps) {
  const pathname = usePathname()
  const isInitialized = useRef(false)

  // Повне очищення Facebook ресурсів
  const clearFacebookResources = () => {
    // Очищення cookies
    const facebookCookies = ["_fbp", "_fbc", "fr"]
    facebookCookies.forEach((cookieName) => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })

    // Видалення скриптів
    document.querySelectorAll('script[src*="fbevents.js"]').forEach((script) => {
      script.remove()
    })

    // Очищення глобальних змінних
    delete window.fbq
    delete window._fbq

    isInitialized.current = false
  }

  // Ініціалізація Facebook Pixel
  const initializeFacebookPixel = () => {
    if (!pixelId || isInitialized.current) {
      return
    }

    console.log("🚀 Initializing Facebook Pixel with ID:", pixelId)

    // Стандартний Facebook Pixel код
    !((f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) => {
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

    // Ініціалізація піксель
    window.fbq("init", pixelId)
    window.fbq("track", "PageView")

    isInitialized.current = true
    console.log("✅ Facebook Pixel initialized")
  }

  // Відстеження переходів по сторінках
  const trackPageView = () => {
    if (!window.fbq || !isInitialized.current) {
      return
    }

    console.log("📊 Tracking page view for:", pathname)
    window.fbq("track", "PageView")

    // Специфічні події
    if (pathname.includes("/models/")) {
      window.fbq("track", "ViewContent", {
        content_type: "product",
      })
    } else if (pathname.includes("/contact")) {
      window.fbq("track", "Contact")
    }
  }

  // Ефект згоди
  useEffect(() => {
    console.log("🔄 Consent changed:", consent, "Initialized:", isInitialized.current)

    if (consent && !isInitialized.current) {
      console.log("✅ Starting initialization...")
      initializeFacebookPixel()
    } else if (!consent && isInitialized.current) {
      console.log("❌ Clearing resources...")
      clearFacebookResources()
      setTimeout(() => window.location.reload(), 100)
    }
  }, [consent, pixelId])

  // Ефект сторінок
  useEffect(() => {
    console.log("🔄 Pathname changed:", pathname, "Consent:", consent, "Initialized:", isInitialized.current)

    if (consent && isInitialized.current) {
      trackPageView()
    }
  }, [pathname])

  // Глобальні функції
  useEffect(() => {
    window.trackServiceClick = (serviceName: string, modelName: string, price: number) => {
      if (window.fbq && consent && isInitialized.current) {
        window.fbq("track", "ViewContent", {
          content_name: serviceName,
          value: price,
          currency: "CZK",
        })
      }
    }

    window.trackContactSubmission = (formData: any) => {
      if (window.fbq && consent && isInitialized.current) {
        window.fbq("track", "Lead", {
          content_name: "Contact Form",
          value: 100,
          currency: "CZK",
        })
      }
    }

    window.trackContactClick = (method: string, location: string) => {
      if (window.fbq && consent && isInitialized.current) {
        window.fbq("track", "Contact", {
          contact_method: method,
        })
      }
    }

    window.testFacebookPixel = () => {
      console.log("=== Facebook Pixel Test ===")
      console.log("Pixel ID:", pixelId)
      console.log("Consent:", consent)
      console.log("Initialized:", isInitialized.current)
      console.log("fbq available:", !!window.fbq)
      console.log("Current pathname:", pathname)

      if (window.fbq && consent && isInitialized.current) {
        window.fbq("trackCustom", "ManualTest", {
          timestamp: new Date().toISOString(),
          page_url: window.location.href,
        })
        console.log("✅ Test event sent")
      } else {
        console.log("❌ Test failed")
      }
    }
  }, [consent, pixelId, pathname])

  return null
}
