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
    if (window.fbq) {
      delete window.fbq
    }
    if (window._fbq) {
      delete window._fbq
    }

    // Видалення скриптів
    const scripts = document.querySelectorAll('script[src*="fbevents.js"]')
    scripts.forEach((script) => script.remove())

    setIsInitialized(false)
  }

  // Функція для ініціалізації Facebook Pixel
  const initializeFacebookPixel = () => {
    if (!pixelId || isInitialized || window.fbq) return // Стандартний Facebook Pixel код
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
  }

  // Відстеження переходів по сторінках
  const trackPageView = () => {
    if (!window.fbq || !isInitialized) return

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
    if (!pixelId) return

    if (consent && !isInitialized) {
      // Згода надана - ініціалізуємо піксель
      const timer = setTimeout(() => {
        initializeFacebookPixel()
      }, 500)
      return () => clearTimeout(timer)
    } else if (!consent && isInitialized) {
      // Згода відкликана - очищуємо все
      clearFacebookResources()
    }
  }, [consent, pixelId, isInitialized])

  // Ефект для відстеження переходів по сторінках
  useEffect(() => {
    if (consent && isInitialized && pathname !== previousPathname.current) {
      const timer = setTimeout(() => {
        trackPageView()
      }, 300)
      previousPathname.current = pathname
      return () => clearTimeout(timer)
    }
  }, [pathname, consent, isInitialized])

  // Глобальні функції для відстеження подій
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Відстеження кліків на послуги
      window.trackServiceClick = (serviceName: string, modelName: string, price: number) => {
        if (window.fbq && isInitialized) {
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
        if (window.fbq && isInitialized) {
          window.fbq("track", "Lead", {
            content_name: "Contact Form",
            value: 100,
            currency: "CZK",
          })
        }
      }

      // Відстеження кліків на контакти
      window.trackContactClick = (method: string, location: string) => {
        if (window.fbq && isInitialized) {
          window.fbq("track", "Contact", {
            contact_method: method,
          })
        }
      }

      // Функція для тестування
      window.testFacebookPixel = () => {
        if (window.fbq && isInitialized) {
          window.fbq("trackCustom", "ManualTest", {
            timestamp: new Date().toISOString(),
            source: "manual_test",
            page_url: window.location.href,
          })
        }
      }
    }
  }, [isInitialized])

  return null
}
