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

  // Стандартна ініціалізація Facebook Pixel
  const initializePixel = () => {
    if (!pixelId || isInitialized) return

    console.log(`🚀 Initializing Facebook Pixel: ${pixelId}`)

    // Стандартний Facebook код
    ;((f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) => {
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

    // Ініціалізація з Enhanced Match
    window.fbq("init", pixelId, {
      // Enhanced Match - покращує таргетинг
      external_id: `user_${Date.now()}`,
      agent: "plnextjs",
    })

    // Початкова подія
    window.fbq("track", "PageView")

    setIsInitialized(true)
    console.log(`✅ Facebook Pixel initialized: ${pixelId}`)
  }

  // ПРАВИЛЬНЕ відкликання згоди
  const revokeConsent = () => {
    if (!window.fbq) return

    console.log("🚫 Revoking Facebook Pixel consent")

    // 1. Офіційний метод відкликання згоди
    window.fbq("consent", "revoke")

    // 2. Зупиняємо всі активні відстеження
    window.fbq("set", "autoConfig", false, pixelId)

    // 3. Очищуємо черги подій
    if (window.fbq.queue) {
      window.fbq.queue.length = 0
    }

    // 4. Простіше очищення cookies
    const cookiesToClear = ["_fbp", "_fbc"]
    cookiesToClear.forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname.replace(/^www\./, "")}`
    })

    // 5. Видаляємо Facebook скрипти
    const fbScripts = document.querySelectorAll('script[src*="fbevents.js"]')
    fbScripts.forEach((script) => script.remove())

    // 6. Очищуємо глобальні змінні
    delete window.fbq
    delete window._fbq

    setIsInitialized(false)
    console.log("✅ Facebook Pixel consent revoked and cleaned")
  }

  // Основна логіка згоди
  useEffect(() => {
    if (consent && !isInitialized) {
      // Надання згоди - ініціалізуємо
      initializePixel()
    } else if (!consent && isInitialized) {
      // Відкликання згоди - повністю зупиняємо
      revokeConsent()
    }
  }, [consent, pixelId, isInitialized])

  // Відстеження переходів по сторінках
  useEffect(() => {
    if (!consent || !isInitialized || !window.fbq) return

    if (pathname !== previousPathname.current) {
      console.log(`📊 Page view: ${pathname}`)

      // Затримка для завантаження сторінки
      setTimeout(() => {
        // Основна подія PageView
        window.fbq("track", "PageView", {
          page_url: window.location.href,
          page_title: document.title,
          referrer: document.referrer || "",
        })

        // Специфічні події для різних типів сторінок
        if (pathname.includes("/models/")) {
          // Сторінка моделі пристрою
          window.fbq("track", "ViewContent", {
            content_type: "product",
            content_category: "device_model",
            content_name: document.title,
            value: 0.01,
            currency: "CZK",
          })
        } else if (pathname.includes("/services/")) {
          // Сторінка послуги
          window.fbq("track", "ViewContent", {
            content_type: "service",
            content_category: "repair_service",
            content_name: document.title,
            value: 0.01,
            currency: "CZK",
          })
        } else if (pathname.includes("/brands/")) {
          // Сторінка бренду
          window.fbq("track", "ViewContent", {
            content_type: "product_catalog",
            content_category: "device_brand",
            content_name: document.title,
            value: 0.01,
            currency: "CZK",
          })
        } else if (pathname.includes("/contact")) {
          // Сторінка контактів
          window.fbq("track", "Contact", {
            content_category: "contact_page",
          })
        }
      }, 300)

      previousPathname.current = pathname
    }
  }, [pathname, consent, isInitialized])

  // Глобальні функції для відстеження конверсій
  useEffect(() => {
    if (typeof window !== "undefined" && consent && isInitialized) {
      // Відстеження кліків на послуги
      window.trackServiceClick = (serviceName: string, modelName: string, price: number) => {
        if (!window.fbq) return

        console.log(`📊 Service click: ${serviceName} for ${modelName}`)

        window.fbq("track", "ViewContent", {
          content_name: serviceName,
          content_type: "service",
          content_category: "repair_service",
          value: price,
          currency: "CZK",
          custom_data: {
            service_name: serviceName,
            device_model: modelName,
            predicted_ltv: price * 2, // Прогнозована життєва вартість
          },
        })

        // Додаткова подія для кращого відстеження інтересу
        window.fbq("trackCustom", "ServiceInterest", {
          service_type: serviceName,
          device_model: modelName,
          price_range: price > 1000 ? "high" : price > 500 ? "medium" : "low",
        })
      }

      // Відстеження відправки форм контактів
      window.trackContactSubmission = (formData: any) => {
        if (!window.fbq) return

        console.log("📊 Contact form submission")

        // Основна подія Lead
        window.fbq("track", "Lead", {
          content_name: "Contact Form Submission",
          content_category: "contact_inquiry",
          value: 100, // Очікувана вартість ліда
          currency: "CZK",
          custom_data: {
            form_type: "contact",
            predicted_ltv: 2000, // Прогнозована життєва вартість клієнта
            lead_quality: "high", // Якість ліда
            ...formData,
          },
        })

        // Enhanced Match - якщо є email або телефон
        if (formData.email || formData.phone) {
          window.fbq(
            "track",
            "Lead",
            {
              content_name: "Enhanced Contact Lead",
              value: 150,
              currency: "CZK",
            },
            {
              em: formData.email ? btoa(formData.email.toLowerCase().trim()) : undefined,
              ph: formData.phone ? btoa(formData.phone.replace(/\D/g, "")) : undefined,
            },
          )
        }
      }

      // Відстеження кліків на контактну інформацію
      window.trackContactClick = (method: string, location: string) => {
        if (!window.fbq) return

        console.log(`📊 Contact click: ${method} from ${location}`)

        window.fbq("track", "Contact", {
          contact_method: method,
          content_category: `${method}_contact`,
          custom_data: {
            contact_location: location,
            contact_method: method,
            interaction_type: "click",
          },
        })

        // Спеціальна подія для телефонних дзвінків
        if (method === "phone") {
          window.fbq("trackCustom", "PhoneCallIntent", {
            source: location,
            value: 50, // Вартість наміру зателефонувати
            currency: "CZK",
          })
        }
      }
    }
  }, [consent, isInitialized])

  // Функція для тестування
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.testFacebookPixel = () => {
        console.log("🧪 === Facebook Pixel Test ===")
        console.log("Consent:", consent)
        console.log("Pixel ID:", pixelId)
        console.log("Initialized:", isInitialized)
        console.log("fbq available:", !!window.fbq)
        console.log("Current URL:", window.location.href)
        console.log("Current cookies:", document.cookie)

        if (window.fbq && consent && isInitialized) {
          const testId = Math.random().toString(36).substring(7)
          console.log(`🧪 Sending test events with ID: ${testId}`)

          // Тестові події
          window.fbq("trackCustom", "PixelTest", {
            test_id: testId,
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
          })

          window.fbq("track", "ViewContent", {
            content_type: "test",
            content_name: "Pixel Test Content",
            value: 1,
            currency: "CZK",
            custom_data: { test_id: testId },
          })

          console.log(`✅ Test events sent with ID: ${testId}`)
        } else {
          console.log("❌ Cannot send test events - pixel not ready or consent not granted")
        }
      }
    }
  }, [consent, pixelId, isInitialized])

  return null
}
