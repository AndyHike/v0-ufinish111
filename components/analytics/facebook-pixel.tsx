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
  const consentRef = useRef(consent)

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

    // Видалення noscript img
    document.querySelectorAll('img[src*="facebook.com/tr"]').forEach((img) => img.remove())

    // Очищення глобальних змінних
    delete window.fbq
    delete window._fbq

    isInitialized.current = false
  }

  // Ініціалізація Facebook Pixel
  const initializeFacebookPixel = () => {
    if (!pixelId || isInitialized.current || window.fbq) return

    // Точний код з Facebook
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

    // Ініціалізація з вашим ID
    window.fbq("init", pixelId)
    window.fbq("track", "PageView")

    // Додаємо noscript img
    const noscriptImg = document.createElement("img")
    noscriptImg.height = 1
    noscriptImg.width = 1
    noscriptImg.style.display = "none"
    noscriptImg.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`
    document.body.appendChild(noscriptImg)

    isInitialized.current = true
  }

  // Відстеження переходів по сторінках
  const trackPageView = () => {
    if (!window.fbq || !isInitialized.current) return

    window.fbq("track", "PageView")

    // Додаємо noscript img для кожного переходу
    const noscriptImg = document.createElement("img")
    noscriptImg.height = 1
    noscriptImg.width = 1
    noscriptImg.style.display = "none"
    noscriptImg.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`
    document.body.appendChild(noscriptImg)

    // Видаляємо img через 5 секунд
    setTimeout(() => {
      if (document.body.contains(noscriptImg)) {
        document.body.removeChild(noscriptImg)
      }
    }, 5000)

    // Специфічні події
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

  // Основний ефект згоди - ВИПРАВЛЕНО
  useEffect(() => {
    const consentChanged = consentRef.current !== consent
    consentRef.current = consent

    if (consent && (!isInitialized.current || consentChanged)) {
      // Згода надана - ініціалізуємо піксель ОДРАЗУ
      initializeFacebookPixel()
    } else if (!consent && isInitialized.current) {
      // Згода відкликана - очищуємо все
      clearFacebookResources()
    }
  }, [consent, pixelId])

  // Відстеження переходів - ВИПРАВЛЕНО
  useEffect(() => {
    if (consent && isInitialized.current && pathname !== previousPathname.current) {
      // Відстежуємо перехід ОДРАЗУ
      trackPageView()
      previousPathname.current = pathname
    }
  }, [pathname, consent, pixelId])

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
      console.log("Consent:", consent)
      console.log("Pixel ID:", pixelId)
      console.log("Initialized:", isInitialized.current)
      console.log("fbq available:", !!window.fbq)
      console.log("Current pathname:", pathname)
      console.log("Previous pathname:", previousPathname.current)

      if (window.fbq && consent && isInitialized.current) {
        window.fbq("trackCustom", "ManualTest", {
          timestamp: new Date().toISOString(),
          page_url: window.location.href,
          pathname: pathname,
        })
        console.log("✅ Test event sent")
      } else {
        console.log("❌ Facebook Pixel not available, consent not granted, or not initialized")
      }
    }
  }, [consent, pixelId, pathname])

  return null
}
