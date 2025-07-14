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
    console.log("🧹 Clearing Facebook resources...")

    // Очищення cookies
    const facebookCookies = ["_fbp", "_fbc", "fr"]
    facebookCookies.forEach((cookieName) => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
    })

    // Видалення скриптів
    document.querySelectorAll('script[src*="fbevents.js"]').forEach((script) => {
      script.remove()
    })

    // Очищення глобальних змінних
    delete window.fbq
    delete window._fbq

    isInitialized.current = false
    console.log("✅ Facebook resources cleared")
  }

  // Ініціалізація Facebook Pixel
  const initializeFacebookPixel = () => {
    if (!pixelId || isInitialized.current) {
      console.log("⚠️ Skipping initialization:", { pixelId, isInitialized: isInitialized.current })
      return
    }

    console.log("🚀 Initializing Facebook Pixel with ID:", pixelId)

    try {
      // Стандартний Facebook Pixel код
      !((f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) => {
        if (f.fbq) return
        n = f.fbq = (...args: any[]) => {
          n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args)
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
      console.log("✅ Facebook Pixel initialized successfully")
    } catch (error) {
      console.error("❌ Facebook Pixel initialization failed:", error)
    }
  }

  // Відстеження переходів по сторінках
  const trackPageView = () => {
    if (!window.fbq || !isInitialized.current || !consent) {
      console.log("⚠️ Skipping page view:", { fbq: !!window.fbq, initialized: isInitialized.current, consent })
      return
    }

    console.log("📊 Tracking page view for:", pathname)

    try {
      window.fbq("track", "PageView")

      // Специфічні події
      if (pathname.includes("/models/")) {
        window.fbq("track", "ViewContent", {
          content_type: "product",
        })
      } else if (pathname.includes("/contact")) {
        window.fbq("track", "Contact")
      }
    } catch (error) {
      console.error("❌ Page view tracking failed:", error)
    }
  }

  // Основний ефект згоди
  useEffect(() => {
    console.log("🔄 Consent effect triggered:", { consent, initialized: isInitialized.current, pixelId })

    if (consent && !isInitialized.current) {
      console.log("✅ Starting initialization due to consent...")
      // Невелика затримка щоб переконатися що DOM готовий
      setTimeout(() => {
        initializeFacebookPixel()
      }, 100)
    } else if (!consent && isInitialized.current) {
      console.log("❌ Clearing resources due to consent withdrawal...")
      clearFacebookResources()
    }
  }, [consent, pixelId])

  // Ефект сторінок
  useEffect(() => {
    if (consent && isInitialized.current) {
      // Невелика затримка для відстеження переходів
      setTimeout(() => {
        trackPageView()
      }, 100)
    }
  }, [pathname, consent])

  // Глобальні функції для тестування та відстеження
  useEffect(() => {
    window.trackServiceClick = (serviceName: string, modelName: string, price: number) => {
      if (window.fbq && consent && isInitialized.current) {
        console.log("📊 Tracking service click:", { serviceName, modelName, price })
        try {
          window.fbq("track", "ViewContent", {
            content_name: serviceName,
            value: price,
            currency: "CZK",
          })
        } catch (error) {
          console.error("❌ Service click tracking failed:", error)
        }
      }
    }

    window.trackContactSubmission = (formData: any) => {
      if (window.fbq && consent && isInitialized.current) {
        console.log("📊 Tracking contact submission:", formData)
        try {
          window.fbq("track", "Lead", {
            content_name: "Contact Form",
            value: 100,
            currency: "CZK",
          })
        } catch (error) {
          console.error("❌ Contact submission tracking failed:", error)
        }
      }
    }

    window.trackContactClick = (method: string, location: string) => {
      if (window.fbq && consent && isInitialized.current) {
        console.log("📊 Tracking contact click:", { method, location })
        try {
          window.fbq("track", "Contact", {
            contact_method: method,
          })
        } catch (error) {
          console.error("❌ Contact click tracking failed:", error)
        }
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
        try {
          window.fbq("trackCustom", "ManualTest", {
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
          })
          console.log("✅ Test event sent successfully")
        } catch (error) {
          console.error("❌ Test event failed:", error)
        }
      } else {
        console.log("❌ Test failed - requirements not met")
      }
    }
  }, [consent, pixelId, pathname])

  return null
}
