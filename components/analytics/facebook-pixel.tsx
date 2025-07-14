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
  const isInitialized = useRef(false)

  // Повне очищення Facebook ресурсів
  const clearFacebookResources = () => {
    // Очищення cookies
    const cookies = ["_fbp", "_fbc", "fr"]
    cookies.forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname.replace(/^www\./, "")};`
    })

    // Видалення скриптів
    document.querySelectorAll('script[src*="fbevents.js"]').forEach((script) => script.remove())

    // Очищення глобальних змінних
    delete window.fbq
    delete window._fbq

    isInitialized.current = false
  }

  // Ініціалізація Facebook Pixel
  const initializeFacebookPixel = () => {
    if (!pixelId || isInitialized.current) return

    // Facebook Pixel код
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

    // Ініціалізація
    window.fbq("init", pixelId)
    window.fbq("track", "PageView")

    isInitialized.current = true
  }

  // Основний ефект згоди
  useEffect(() => {
    if (consent) {
      initializeFacebookPixel()
    } else {
      clearFacebookResources()
    }
  }, [consent, pixelId])

  // Відстеження переходів
  useEffect(() => {
    if (consent && isInitialized.current && pathname !== previousPathname.current) {
      if (window.fbq) {
        window.fbq("track", "PageView")

        // Специфічні події
        if (pathname.includes("/models/")) {
          window.fbq("track", "ViewContent", { content_type: "product" })
        } else if (pathname.includes("/contact")) {
          window.fbq("track", "Contact")
        }
      }
      previousPathname.current = pathname
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
      if (window.fbq && consent) {
        window.fbq("trackCustom", "ManualTest", {
          timestamp: new Date().toISOString(),
          page_url: window.location.href,
        })
        console.log("Facebook Pixel test event sent")
      } else {
        console.log("Facebook Pixel not available or consent not granted")
      }
    }
  }, [consent])

  return null
}
