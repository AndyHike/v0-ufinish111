"use client"

import { useEffect, useRef } from "react"

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
    FB_PIXEL_INITIALIZED: boolean
  }
}

export function FacebookPixel({ pixelId, consent }: FacebookPixelProps) {
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
    window.FB_PIXEL_INITIALIZED = false

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

      // Ініціалізація піксель та відправка PageView
      window.fbq("init", pixelId)
      window.fbq("track", "PageView")

      // Встановлення глобального флагу
      window.FB_PIXEL_INITIALIZED = true
      isInitialized.current = true

      console.log("✅ Facebook Pixel initialized successfully with PageView")

      // Повідомляємо про ініціалізацію
      window.dispatchEvent(
        new CustomEvent("facebookPixelInitialized", {
          detail: { pixelId },
        }),
      )
    } catch (error) {
      console.error("❌ Facebook Pixel initialization failed:", error)
    }
  }

  // Основний ефект згоди
  useEffect(() => {
    console.log("🔄 Consent effect triggered:", { consent, initialized: isInitialized.current, pixelId })

    if (consent && !isInitialized.current) {
      console.log("✅ Starting initialization due to consent...")
      initializeFacebookPixel()
    } else if (!consent && isInitialized.current) {
      console.log("❌ Clearing resources due to consent withdrawal...")
      clearFacebookResources()
    }
  }, [consent, pixelId])

  // Глобальні функції для відстеження
  useEffect(() => {
    window.trackServiceClick = (serviceName: string, modelName: string, price: number) => {
      if (window.fbq && consent && isInitialized.current) {
        console.log("📊 Tracking service click:", { serviceName, modelName, price })
        try {
          window.fbq("track", "ViewContent", {
            content_name: `${serviceName} - ${modelName}`,
            content_type: "service",
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
        console.log("📊 Tracking contact submission")
        try {
          window.fbq("track", "Lead", {
            content_name: "Contact Form Submission",
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
          window.fbq("trackCustom", "ContactClick", {
            contact_method: method,
            page_location: location,
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
      console.log("Global flag:", window.FB_PIXEL_INITIALIZED)

      if (window.fbq && consent && isInitialized.current) {
        try {
          window.fbq("trackCustom", "ManualTest", {
            content_name: "Manual Pixel Test",
            test_timestamp: new Date().toISOString(),
          })
          console.log("✅ Test event sent successfully")
        } catch (error) {
          console.error("❌ Test event failed:", error)
        }
      } else {
        console.log("❌ Test failed - requirements not met")
      }
    }
  }, [consent, pixelId])

  return null
}
