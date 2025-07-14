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
    FB_PIXEL_INITIALIZED: boolean
    testFacebookPixel: () => void
    trackServiceClick: (serviceName: string, modelName: string, price: number) => void
    trackContactSubmission: (formData: any) => void
    trackContactClick: (method: string, location: string) => void
  }
}

export function FacebookPixel({ pixelId, consent }: FacebookPixelProps) {
  const pathname = usePathname()
  const isInitialized = useRef(false)

  console.log("🔄 FacebookPixel render:", { pixelId, consent, pathname, initialized: isInitialized.current })

  // Повне очищення Facebook ресурсів
  const clearFacebookResources = () => {
    console.log("🧹 Clearing Facebook resources...")

    // Очищення cookies
    const facebookCookies = ["_fbp", "_fbc", "fr"]
    facebookCookies.forEach((cookieName) => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname.replace(/^www\./, "")};`
    })

    // Видалення скриптів
    document.querySelectorAll('script[src*="fbevents.js"]').forEach((script) => {
      script.remove()
    })

    // Видалення noscript img
    document.querySelectorAll('img[src*="facebook.com/tr"]').forEach((img) => {
      img.remove()
    })

    // Очищення глобальних змінних
    delete window.fbq
    delete window._fbq
    window.FB_PIXEL_INITIALIZED = false

    isInitialized.current = false
    console.log("✅ Facebook resources cleared")
  }

  // Ініціалізація Facebook Pixel
  const initializeFacebookPixel = () => {
    if (!pixelId) {
      console.error("❌ No pixelId provided")
      return
    }

    if (isInitialized.current) {
      console.log("⚠️ Already initialized")
      return
    }

    console.log("🚀 Starting Facebook Pixel initialization with ID:", pixelId)

    try {
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

      // Додаємо noscript img
      const noscriptImg = document.createElement("img")
      noscriptImg.height = 1
      noscriptImg.width = 1
      noscriptImg.style.display = "none"
      noscriptImg.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`
      document.body.appendChild(noscriptImg)

      // Встановлюємо флаги
      isInitialized.current = true
      window.FB_PIXEL_INITIALIZED = true

      console.log("✅ Facebook Pixel initialized successfully")
    } catch (error) {
      console.error("❌ Facebook Pixel initialization failed:", error)
    }
  }

  // Відстеження переходів по сторінках
  const trackPageView = () => {
    if (!window.fbq || !isInitialized.current) {
      console.log("⚠️ Cannot track page view - fbq:", !!window.fbq, "initialized:", isInitialized.current)
      return
    }

    console.log("📊 Tracking page view for:", pathname)

    try {
      window.fbq("track", "PageView")

      // Специфічні події
      if (pathname.includes("/models/")) {
        window.fbq("track", "ViewContent", { content_type: "product" })
      } else if (pathname.includes("/contact")) {
        window.fbq("track", "Contact")
      }

      console.log("✅ Page view tracked successfully")
    } catch (error) {
      console.error("❌ Page view tracking failed:", error)
    }
  }

  // Ефект згоди - СПРОЩЕНИЙ
  useEffect(() => {
    console.log("🔄 Consent useEffect triggered:", { consent, pixelId, initialized: isInitialized.current })

    if (consent && !isInitialized.current) {
      console.log("✅ Consent granted - initializing pixel NOW")
      initializeFacebookPixel()
    } else if (!consent && isInitialized.current) {
      console.log("❌ Consent revoked - clearing resources")
      clearFacebookResources()
      setTimeout(() => window.location.reload(), 100)
    }
  }, [consent, pixelId])

  // Ефект сторінок - СПРОЩЕНИЙ
  useEffect(() => {
    console.log("🔄 Pathname useEffect triggered:", { pathname, consent, initialized: isInitialized.current })

    if (consent && isInitialized.current) {
      console.log("📊 Tracking page view...")
      trackPageView()
    } else {
      console.log("⚠️ Skipping page tracking - consent:", consent, "initialized:", isInitialized.current)
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
        window.fbq("track", "Contact", { contact_method: method })
      }
    }

    window.testFacebookPixel = () => {
      console.log("=== Facebook Pixel Test ===")
      console.log("Pixel ID:", pixelId)
      console.log("Consent:", consent)
      console.log("Initialized:", isInitialized.current)
      console.log("fbq available:", !!window.fbq)
      console.log("Global flag:", window.FB_PIXEL_INITIALIZED)
      console.log("Current pathname:", pathname)

      if (window.fbq && consent && isInitialized.current) {
        window.fbq("trackCustom", "ManualTest", {
          timestamp: new Date().toISOString(),
          page_url: window.location.href,
        })
        console.log("✅ Test event sent")
      } else {
        console.log("❌ Test failed - missing requirements")
      }
    }
  }, [consent, pixelId, pathname])

  return null
}
