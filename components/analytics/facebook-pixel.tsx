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
  const consentRef = useRef(consent)
  const isInitialized = useRef(false)
  const currentPixelId = useRef(pixelId)

  console.log("🔄 FacebookPixel render:", { pixelId, consent, pathname })

  // Повне очищення Facebook ресурсів
  const clearFacebookResources = () => {
    console.log("🧹 Clearing Facebook resources...")

    // Очищення cookies
    const facebookCookies = ["_fbp", "_fbc", "fr", "_gcl_aw", "_gcl_dc"]
    const domains = [
      "",
      window.location.hostname,
      "." + window.location.hostname,
      "." + window.location.hostname.replace(/^www\./, ""),
    ]

    facebookCookies.forEach((cookieName) => {
      domains.forEach((domain) => {
        const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
        const cookieString = domain
          ? `${cookieName}=; expires=${expireDate}; path=/; domain=${domain}`
          : `${cookieName}=; expires=${expireDate}; path=/`
        document.cookie = cookieString
      })
    })

    // Видалення скриптів
    document.querySelectorAll('script[src*="fbevents.js"]').forEach((script) => {
      console.log("🗑️ Removing Facebook script")
      script.remove()
    })

    // Видалення noscript img
    document.querySelectorAll('img[src*="facebook.com/tr"]').forEach((img) => {
      img.remove()
    })

    // Очищення глобальних змінних
    if (window.fbq) {
      delete window.fbq
    }
    if (window._fbq) {
      delete window._fbq
    }
    window.FB_PIXEL_INITIALIZED = false

    isInitialized.current = false
    console.log("✅ Facebook resources cleared")
  }

  // Ініціалізація Facebook Pixel
  const initializeFacebookPixel = () => {
    if (!pixelId) {
      console.error("❌ No pixelId provided for initialization")
      return
    }

    if (isInitialized.current) {
      console.log("⚠️ Facebook Pixel already initialized")
      return
    }

    console.log("🚀 Initializing Facebook Pixel with ID:", pixelId)

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

      console.log("📊 Facebook Pixel initialized and PageView tracked")

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
      currentPixelId.current = pixelId

      console.log("✅ Facebook Pixel fully initialized")
    } catch (error) {
      console.error("❌ Facebook Pixel initialization failed:", error)
    }
  }

  // Відстеження переходів по сторінках
  const trackPageView = () => {
    if (!window.fbq || !isInitialized.current) {
      console.log("⚠️ Cannot track page view - pixel not initialized")
      return
    }

    console.log("📊 Tracking page view for:", pathname)

    try {
      window.fbq("track", "PageView")

      // Додаємо noscript img для кожного переходу
      const noscriptImg = document.createElement("img")
      noscriptImg.height = 1
      noscriptImg.width = 1
      noscriptImg.style.display = "none"
      noscriptImg.src = `https://www.facebook.com/tr?id=${currentPixelId.current}&ev=PageView&noscript=1`
      document.body.appendChild(noscriptImg)

      // Видаляємо img через 5 секунд
      setTimeout(() => {
        if (document.body.contains(noscriptImg)) {
          document.body.removeChild(noscriptImg)
        }
      }, 5000)

      // Специфічні події для різних типів сторінок
      if (pathname.includes("/models/")) {
        window.fbq("track", "ViewContent", {
          content_type: "product",
          content_category: "device_model",
        })
        console.log("📊 ViewContent tracked for model page")
      } else if (pathname.includes("/brands/")) {
        window.fbq("track", "ViewContent", {
          content_type: "product_catalog",
          content_category: "device_brand",
        })
        console.log("📊 ViewContent tracked for brand page")
      } else if (pathname.includes("/contact")) {
        window.fbq("track", "Contact")
        console.log("📊 Contact tracked for contact page")
      }
    } catch (error) {
      console.error("❌ Facebook Pixel tracking failed:", error)
    }
  }

  // Основний ефект для обробки згоди
  useEffect(() => {
    console.log("🔄 Consent effect:", { consent, pixelId, initialized: isInitialized.current })

    const consentChanged = consentRef.current !== consent
    consentRef.current = consent

    if (consent && !isInitialized.current) {
      console.log("✅ Consent granted - initializing pixel")
      initializeFacebookPixel()
    } else if (!consent && isInitialized.current) {
      console.log("❌ Consent revoked - clearing resources")
      clearFacebookResources()

      // Рекомендований reload для повного відключення
      setTimeout(() => {
        console.log("🔄 Reloading page for complete pixel shutdown")
        window.location.reload()
      }, 100)
    } else if (consent && isInitialized.current) {
      console.log("ℹ️ Consent granted but pixel already initialized")
    } else {
      console.log("ℹ️ No consent, pixel remains uninitialized")
    }
  }, [consent, pixelId])

  // Ефект для відстеження переходів по сторінках
  useEffect(() => {
    console.log("🔄 Pathname effect:", { pathname, consent, initialized: isInitialized.current })

    if (consent && isInitialized.current) {
      trackPageView()
    } else {
      console.log("⚠️ Skipping page tracking - no consent or not initialized")
    }
  }, [pathname, consent])

  // Глобальні функції для відстеження подій
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Відстеження кліків на послуги
      window.trackServiceClick = (serviceName: string, modelName: string, price: number) => {
        if (window.fbq && consent && isInitialized.current) {
          window.fbq("track", "ViewContent", {
            content_name: serviceName,
            content_type: "service",
            value: price,
            currency: "CZK",
            custom_data: {
              service_name: serviceName,
              model_name: modelName,
            },
          })
          console.log("📊 Service click tracked:", serviceName)
        }
      }

      // Відстеження відправки форми контактів
      window.trackContactSubmission = (formData: any) => {
        if (window.fbq && consent && isInitialized.current) {
          window.fbq("track", "Lead", {
            content_name: "Contact Form Submission",
            content_category: "contact_inquiry",
            value: 100,
            currency: "CZK",
            custom_data: formData,
          })
          console.log("📊 Contact submission tracked")
        }
      }

      // Відстеження кліків на контакти
      window.trackContactClick = (method: string, location: string) => {
        if (window.fbq && consent && isInitialized.current) {
          window.fbq("track", "Contact", {
            contact_method: method,
            content_category: `${method}_contact`,
            custom_data: {
              contact_location: location,
              contact_method: method,
            },
          })
          console.log("📊 Contact click tracked:", method)
        }
      }

      // Функція для тестування
      window.testFacebookPixel = () => {
        console.log("=== Facebook Pixel Test ===")
        console.log("Consent:", consent)
        console.log("Pixel ID:", pixelId)
        console.log("Current Pixel ID:", currentPixelId.current)
        console.log("Initialized:", isInitialized.current)
        console.log("Global flag:", window.FB_PIXEL_INITIALIZED)
        console.log("fbq available:", !!window.fbq)
        console.log("Current pathname:", pathname)
        console.log("Current cookies:", document.cookie)

        if (window.fbq && consent && isInitialized.current) {
          window.fbq("trackCustom", "ManualTest", {
            timestamp: new Date().toISOString(),
            source: "manual_test",
            page_url: window.location.href,
            pathname: pathname,
            pixel_id: currentPixelId.current,
          })
          console.log("✅ Test event sent successfully with ID:", currentPixelId.current)
        } else {
          console.log("❌ Facebook Pixel not available, consent not granted, or not initialized")
          console.log("Debug info:", {
            fbq: !!window.fbq,
            consent,
            initialized: isInitialized.current,
          })
        }
      }
    }
  }, [consent, pixelId, pathname])

  return null
}
