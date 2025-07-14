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
    testFacebookPixel: () => void
    trackServiceClick: (serviceName: string, modelName: string, price: number) => void
    trackContactSubmission: (formData: any) => void
    trackContactClick: (method: string, location: string) => void
  }
}

export function FacebookPixel({ pixelId, consent }: FacebookPixelProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const pathname = usePathname()
  const previousPathname = useRef(pathname)

  // Функція для повного очищення Facebook ресурсів
  const clearFacebookResources = () => {
    console.log("🧹 Clearing Facebook Pixel resources...")

    // Очищення cookies
    const facebookCookies = ["_fbp", "_fbc", "fr"]
    const domains = ["", window.location.hostname, "." + window.location.hostname.replace(/^www\./, "")]

    facebookCookies.forEach((cookieName) => {
      domains.forEach((domain) => {
        const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
        const cookieString = domain
          ? `${cookieName}=; expires=${expireDate}; path=/; domain=${domain}`
          : `${cookieName}=; expires=${expireDate}; path=/`
        document.cookie = cookieString
      })
    })

    // Очищення глобальних змінних
    delete window.fbq
    delete window._fbq

    // Видалення скриптів
    const scripts = document.querySelectorAll('script[src*="fbevents.js"]')
    scripts.forEach((script) => script.remove())

    setIsInitialized(false)
    console.log("✅ Facebook Pixel resources cleared")
  }

  // Функція для ініціалізації Facebook Pixel
  const initializeFacebookPixel = () => {
    if (!pixelId || isInitialized) return

    console.log(`🚀 Initializing Facebook Pixel: ${pixelId}`)

    // Стандартний Facebook Pixel код
    ;((f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) => {
      if (f.fbq) return
      n = f.fbq = () => {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      }
      if (!f._fbq) f._fbq = n
      n.push = n
      n.loaded = true
      n.version = "2.0"
      n.queue = []
      t = b.createElement(e)
      t.async = true
      t.src = v
      s = b.getElementsByTagName(e)[0]
      s.parentNode.insertBefore(t, s)
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")

    // Ініціалізація піксель
    window.fbq("init", pixelId)
    window.fbq("track", "PageView")

    setIsInitialized(true)
    console.log(`✅ Facebook Pixel initialized: ${pixelId}`)
  }

  // Відстеження переходів по сторінках
  const trackPageView = () => {
    if (!window.fbq || !isInitialized) return

    console.log(`📊 Tracking page view: ${pathname}`)

    window.fbq("track", "PageView")

    // Специфічні події для різних типів сторінок
    if (pathname.includes("/models/")) {
      window.fbq("track", "ViewContent", {
        content_type: "product",
        content_category: "device_model",
      })
    } else if (pathname.includes("/brands/")) {
      window.fbq("track", "ViewContent", {
        content_type: "product_catalog",
        content_category: "device_brand",
      })
    } else if (pathname.includes("/contact")) {
      window.fbq("track", "Contact")
    }
  }

  // Основний ефект для обробки згоди
  useEffect(() => {
    if (consent && !isInitialized) {
      // Згода надана - ініціалізуємо піксель
      setTimeout(() => initializeFacebookPixel(), 100)
    } else if (!consent && isInitialized) {
      // Згода відкликана - очищуємо все
      clearFacebookResources()
    }
  }, [consent, pixelId])

  // Ефект для відстеження переходів по сторінках
  useEffect(() => {
    if (consent && isInitialized && pathname !== previousPathname.current) {
      setTimeout(() => trackPageView(), 300)
      previousPathname.current = pathname
    }
  }, [pathname, consent, isInitialized])

  // Глобальні функції для відстеження подій
  useEffect(() => {
    if (typeof window !== "undefined" && isInitialized) {
      // Відстеження кліків на послуги
      window.trackServiceClick = (serviceName: string, modelName: string, price: number) => {
        if (window.fbq) {
          window.fbq("track", "ViewContent", {
            content_name: serviceName,
            content_type: "service",
            value: price,
            currency: "CZK",
          })
        }
      }

      // Відстеження відправки форми контактів
      window.trackContactSubmission = (formData: any) => {
        if (window.fbq) {
          window.fbq("track", "Lead", {
            content_name: "Contact Form",
            value: 100,
            currency: "CZK",
          })
        }
      }

      // Відстеження кліків на контакти
      window.trackContactClick = (method: string, location: string) => {
        if (window.fbq) {
          window.fbq("track", "Contact", {
            contact_method: method,
          })
        }
      }

      // Функція для тестування
      window.testFacebookPixel = () => {
        console.log("🧪 === Facebook Pixel Test ===")
        console.log("Consent:", consent)
        console.log("Pixel ID:", pixelId)
        console.log("Initialized:", isInitialized)
        console.log("fbq available:", !!window.fbq)
        console.log("Current URL:", window.location.href)

        if (window.fbq) {
          window.fbq("trackCustom", "ManualTest", {
            timestamp: new Date().toISOString(),
            source: "manual_test",
            page_url: window.location.href,
          })
          console.log("✅ Test event sent")
        } else {
          console.log("❌ fbq not available")
        }
      }
    }
  }, [isInitialized, consent, pixelId])

  return null
}
