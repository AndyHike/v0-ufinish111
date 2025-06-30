"use client"

import { useEffect, useRef, useState } from "react"
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
  }
}

export function FacebookPixel({ pixelId, consent }: FacebookPixelProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const pathname = usePathname()
  const previousPathname = useRef(pathname)
  const consentRef = useRef(consent)
  const initializationAttempted = useRef(false)

  // Функція для очищення Facebook cookies
  const clearFacebookCookies = () => {
    if (typeof document === "undefined") return

    console.log("🧹 Clearing Facebook cookies...")

    const facebookCookies = ["_fbp", "_fbc", "fr"]
    const domains = ["", window.location.hostname, "." + window.location.hostname]

    facebookCookies.forEach((cookieName) => {
      domains.forEach((domain) => {
        const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
        const clearVariants = [
          `${cookieName}=; expires=${expireDate}; path=/`,
          `${cookieName}=; expires=${expireDate}; path=/; domain=${domain}`,
        ]

        clearVariants.forEach((variant) => {
          document.cookie = variant
        })
      })
    })

    // Очищення глобальних змінних
    if (typeof window !== "undefined") {
      delete window.fbq
      delete window._fbq
      window.FB_PIXEL_INITIALIZED = false
    }

    // Видалення існуючих скриптів
    const existingScripts = document.querySelectorAll('script[src*="fbevents.js"]')
    existingScripts.forEach((script) => script.remove())

    setIsInitialized(false)
    initializationAttempted.current = false
  }

  // Функція для ініціалізації Facebook Pixel
  const initializeFacebookPixel = () => {
    if (!pixelId || isInitialized || initializationAttempted.current) {
      console.log("🔄 Facebook Pixel already initialized or in progress")
      return
    }

    console.log(`🚀 Initializing Facebook Pixel with ID: ${pixelId}`)
    initializationAttempted.current = true

    try {
      // 1. Створюємо fbq функцію якщо її немає
      if (!window.fbq) {
        console.log("🔧 Creating fbq function...")
        window.fbq = function fbq() {
          if (window.fbq.callMethod) {
            window.fbq.callMethod.apply(window.fbq, arguments)
          } else {
            window.fbq.queue.push(arguments)
          }
        }
        window.fbq.push = window.fbq
        window.fbq.loaded = true
        window.fbq.version = "2.0"
        window.fbq.queue = []
        if (!window._fbq) window._fbq = window.fbq
      }

      // 2. Завантажуємо скрипт
      console.log("📥 Loading Facebook Pixel script...")
      const script = document.createElement("script")
      script.async = true
      script.src = "https://connect.facebook.net/en_US/fbevents.js"

      script.onload = () => {
        console.log("✅ Facebook Pixel script loaded")

        // 3. Ініціалізуємо pixel
        console.log("🎯 Initializing pixel...")
        window.fbq("init", pixelId)

        // 4. Відправляємо PageView
        console.log("📊 Sending PageView...")
        window.fbq("track", "PageView")

        // 5. Відправляємо додаткові події
        setTimeout(() => {
          window.fbq("track", "ViewContent", {
            content_type: "website",
            source: "dynamic_initialization",
          })

          window.fbq("trackCustom", "CookieConsentGranted", {
            consent_method: "banner",
            timestamp: new Date().toISOString(),
          })

          console.log("📊 Additional events sent")
        }, 1000)

        setIsInitialized(true)
        window.FB_PIXEL_INITIALIZED = true
        console.log(`✅ Facebook Pixel ${pixelId} initialized successfully`)

        // Диспатчимо подію
        window.dispatchEvent(
          new CustomEvent("facebookPixelInitialized", {
            detail: { pixelId, timestamp: Date.now() },
          }),
        )
      }

      script.onerror = (error) => {
        console.error("❌ Failed to load Facebook Pixel script:", error)
        initializationAttempted.current = false
      }

      document.head.appendChild(script)
    } catch (error) {
      console.error("❌ Failed to initialize Facebook Pixel:", error)
      initializationAttempted.current = false
    }
  }

  // Функція для відстеження переходів по сторінках
  const trackPageView = () => {
    if (!window.fbq || !isInitialized) {
      console.log("⚠️ Cannot track page view - pixel not initialized")
      return
    }

    console.log(`📊 Tracking page view: ${pathname}`)
    window.fbq("track", "PageView")

    // Додаткові події залежно від типу сторінки
    if (pathname.includes("/contact")) {
      window.fbq("track", "Contact")
    } else if (pathname.includes("/models/")) {
      window.fbq("track", "ViewContent", {
        content_type: "product",
        content_category: "device_model",
      })
    } else if (pathname.includes("/brands/")) {
      window.fbq("track", "ViewContent", {
        content_type: "category",
        content_category: "device_brand",
      })
    }

    // Кастомна подія навігації
    window.fbq("trackCustom", "PageNavigation", {
      from_page: previousPathname.current,
      to_page: pathname,
      timestamp: new Date().toISOString(),
    })
  }

  // Основний ефект для обробки згоди
  useEffect(() => {
    console.log(`🔄 Consent effect: ${consentRef.current} -> ${consent}, pixelId: ${pixelId}`)

    if (!pixelId) {
      console.log("⚠️ No pixelId provided")
      return
    }

    const consentChanged = consentRef.current !== consent
    consentRef.current = consent

    if (consent) {
      console.log(`🟢 Facebook Pixel consent granted for ID: ${pixelId}`)

      // Якщо згода змінилась на true, ініціалізуємо
      if (consentChanged || !isInitialized) {
        console.log("🚀 Starting initialization...")
        initializeFacebookPixel()
      }
    } else {
      console.log("🔴 Facebook Pixel consent denied - clearing")
      clearFacebookCookies()
    }
  }, [pixelId, consent])

  // Ефект для відстеження переходів по сторінках
  useEffect(() => {
    if (consent && isInitialized && pathname !== previousPathname.current) {
      console.log(`🔄 Page changed: ${previousPathname.current} -> ${pathname}`)
      setTimeout(() => {
        trackPageView()
      }, 100)
      previousPathname.current = pathname
    }
  }, [pathname, consent, isInitialized])

  // Глобальна функція для тестування
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.testFacebookPixel = () => {
        console.log("🧪 Testing Facebook Pixel...")
        console.log("Consent:", consent)
        console.log("Pixel ID:", pixelId)
        console.log("Initialized:", isInitialized)
        console.log("fbq available:", !!window.fbq)
        console.log("Global flag:", window.FB_PIXEL_INITIALIZED)
        console.log("Cookies:", document.cookie)

        if (window.fbq) {
          window.fbq("trackCustom", "ManualTest", {
            timestamp: new Date().toISOString(),
            source: "manual_test",
          })
          console.log("✅ Test event sent")
        } else {
          console.log("❌ fbq not available")
        }
      }
    }
  }, [consent, pixelId, isInitialized])

  // Слухаємо події зміни згоди
  useEffect(() => {
    const handleConsentChange = (event: CustomEvent) => {
      console.log("🔄 Received consent change event:", event.detail)

      if (event.detail.consent.marketing && !consent) {
        console.log("🚀 Marketing consent granted via event")
        setTimeout(() => {
          if (!isInitialized && !initializationAttempted.current) {
            initializeFacebookPixel()
          }
        }, 100)
      }
    }

    window.addEventListener("cookieConsentChanged", handleConsentChange as EventListener)

    return () => {
      window.removeEventListener("cookieConsentChanged", handleConsentChange as EventListener)
    }
  }, [consent, isInitialized])

  return null
}
