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
  const previousPathname = useRef(pathname)
  const scriptLoaded = useRef(false)
  const pixelInitialized = useRef(false)

  // Стандартна ініціалізація Facebook Pixel
  const loadFacebookPixel = () => {
    if (scriptLoaded.current || !consent || !pixelId) return

    console.log(`🚀 Loading Facebook Pixel: ${pixelId}`)

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

    scriptLoaded.current = true

    // Ініціалізація пікселя
    window.fbq("init", pixelId)
    window.fbq("track", "PageView")

    pixelInitialized.current = true
    console.log(`✅ Facebook Pixel initialized: ${pixelId}`)
  }

  // Очищення при відкликанні згоди
  const clearFacebookPixel = () => {
    if (!scriptLoaded.current) return

    console.log("🧹 Clearing Facebook Pixel")

    // Очищення cookies
    const cookiesToClear = ["_fbp", "_fbc"]
    cookiesToClear.forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`
      const baseDomain = window.location.hostname.replace(/^www\./, "")
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${baseDomain}`
    })

    // Видалення скриптів
    const fbScripts = document.querySelectorAll('script[src*="fbevents.js"]')
    fbScripts.forEach((script) => script.remove())

    // Очищення глобальних змінних
    if (window.fbq) {
      delete window.fbq
    }
    if (window._fbq) {
      delete window._fbq
    }

    scriptLoaded.current = false
    pixelInitialized.current = false
    console.log("✅ Facebook Pixel cleared")
  }

  // Основна логіка згоди
  useEffect(() => {
    if (consent) {
      loadFacebookPixel()
    } else {
      clearFacebookPixel()
    }
  }, [consent, pixelId])

  // Відстеження переходів по сторінках
  useEffect(() => {
    if (!consent || !pixelInitialized.current || !window.fbq) return

    if (pathname !== previousPathname.current) {
      console.log(`📊 Page view: ${pathname}`)

      window.fbq("track", "PageView")

      // Специфічні події для різних типів сторінок
      if (pathname.includes("/models/")) {
        window.fbq("track", "ViewContent", {
          content_type: "product",
          content_category: "device_model",
        })
      } else if (pathname.includes("/services/")) {
        window.fbq("track", "ViewContent", {
          content_type: "service",
          content_category: "repair_service",
        })
      } else if (pathname.includes("/contact")) {
        window.fbq("track", "Contact")
      }

      previousPathname.current = pathname
    }
  }, [pathname, consent])

  // Глобальні функції для відстеження
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Відстеження кліків на послуги
      window.trackServiceClick = (serviceName: string, modelName: string, price: number) => {
        if (!window.fbq || !consent || !pixelInitialized.current) return

        window.fbq("track", "ViewContent", {
          content_name: serviceName,
          content_type: "service",
          value: price,
          currency: "CZK",
        })
      }

      // Відстеження форм контактів
      window.trackContactSubmission = (formData: any) => {
        if (!window.fbq || !consent || !pixelInitialized.current) return

        window.fbq("track", "Lead", {
          content_name: "Contact Form",
          value: 100,
          currency: "CZK",
        })
      }

      // Відстеження кліків на контакти
      window.trackContactClick = (method: string, location: string) => {
        if (!window.fbq || !consent || !pixelInitialized.current) return

        window.fbq("track", "Contact", {
          contact_method: method,
        })
      }

      // Функція тестування
      window.testFacebookPixel = () => {
        console.log("🧪 === Facebook Pixel Test ===")
        console.log("Consent:", consent)
        console.log("Pixel ID:", pixelId)
        console.log("Script loaded:", scriptLoaded.current)
        console.log("Pixel initialized:", pixelInitialized.current)
        console.log("fbq available:", !!window.fbq)
        console.log("Current cookies:", document.cookie)

        if (window.fbq && consent && pixelInitialized.current) {
          window.fbq("trackCustom", "PixelTest", {
            test_timestamp: Date.now(),
            page_url: window.location.href,
          })
          console.log("✅ Test event sent")
        } else {
          console.log("❌ Cannot send test - pixel not ready or consent not granted")
        }
      }
    }
  }, [consent, pixelId])

  return null
}
