"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

interface FacebookPixelProps {
  pixelId: string
  consent: boolean
}

declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: any
    FB_PIXEL_LOADED: boolean
    testFacebookPixel: () => void
    trackServiceClick: (serviceName: string, modelName: string, price: number) => void
    trackContactSubmission: (formData: any) => void
    trackContactClick: (method: string, location: string) => void
  }
}

export function FacebookPixel({ pixelId, consent }: FacebookPixelProps) {
  const pathname = usePathname()

  // Очищення Facebook ресурсів
  const clearFacebook = () => {
    // Cookies
    document.cookie = "_fbp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "_fbc=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "fr=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    // Scripts
    document.querySelectorAll('script[src*="fbevents"]').forEach((s) => s.remove())

    // Variables
    delete window.fbq
    delete window._fbq
    window.FB_PIXEL_LOADED = false
  }

  // Ініціалізація Facebook Pixel
  const initFacebook = () => {
    if (window.FB_PIXEL_LOADED) return

    // Facebook код
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

    window.fbq("init", pixelId)
    window.fbq("track", "PageView")
    window.FB_PIXEL_LOADED = true
  }

  // Ефект згоди
  useEffect(() => {
    if (consent) {
      initFacebook()
    } else {
      clearFacebook()
    }
  }, [consent])

  // Ефект сторінок
  useEffect(() => {
    if (consent && window.fbq && window.FB_PIXEL_LOADED) {
      window.fbq("track", "PageView")

      if (pathname.includes("/models/")) {
        window.fbq("track", "ViewContent", { content_type: "product" })
      } else if (pathname.includes("/contact")) {
        window.fbq("track", "Contact")
      }
    }
  }, [pathname, consent])

  // Глобальні функції
  useEffect(() => {
    window.trackServiceClick = (serviceName: string, modelName: string, price: number) => {
      if (window.fbq && consent) {
        window.fbq("track", "ViewContent", {
          content_name: serviceName,
          value: price,
          currency: "CZK",
        })
      }
    }

    window.trackContactSubmission = (formData: any) => {
      if (window.fbq && consent) {
        window.fbq("track", "Lead", {
          content_name: "Contact Form",
          value: 100,
          currency: "CZK",
        })
      }
    }

    window.trackContactClick = (method: string, location: string) => {
      if (window.fbq && consent) {
        window.fbq("track", "Contact", { contact_method: method })
      }
    }

    window.testFacebookPixel = () => {
      console.log("=== Facebook Pixel Test ===")
      console.log("Consent:", consent)
      console.log("Pixel ID:", pixelId)
      console.log("FB_PIXEL_LOADED:", window.FB_PIXEL_LOADED)
      console.log("fbq exists:", !!window.fbq)
      console.log("Current page:", pathname)

      if (window.fbq && consent) {
        window.fbq("trackCustom", "TestEvent", {
          page: pathname,
          timestamp: Date.now(),
        })
        console.log("✅ Test event sent")
      } else {
        console.log("❌ Not working")
      }
    }
  }, [consent, pixelId, pathname])

  return null
}
