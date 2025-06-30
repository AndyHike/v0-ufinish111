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

  // Функція для створення Facebook cookies вручну
  const createFacebookCookies = () => {
    if (typeof document === "undefined") return

    console.log("🍪 Creating Facebook cookies manually...")

    // Створюємо _fbp cookie
    const fbpValue = `fb.1.${Date.now()}.${Math.random().toString(36).substring(2, 15)}`
    const fbpExpires = new Date()
    fbpExpires.setFullYear(fbpExpires.getFullYear() + 1)

    const fbpCookie = `_fbp=${fbpValue}; expires=${fbpExpires.toUTCString()}; path=/; domain=${window.location.hostname}; SameSite=Lax`
    document.cookie = fbpCookie
    console.log("🍪 Created _fbp cookie:", fbpCookie)

    // Створюємо _fbc cookie
    const fbcValue = `fb.1.${Date.now()}.${pixelId}`
    const fbcExpires = new Date()
    fbcExpires.setDate(fbcExpires.getDate() + 7)

    const fbcCookie = `_fbc=${fbcValue}; expires=${fbcExpires.toUTCString()}; path=/; domain=${window.location.hostname}; SameSite=Lax`
    document.cookie = fbcCookie
    console.log("🍪 Created _fbc cookie:", fbcCookie)

    // Перевіряємо чи створились cookies
    setTimeout(() => {
      const currentCookies = document.cookie
      console.log("🍪 Current cookies after creation:", currentCookies)

      if (!currentCookies.includes("_fbp")) {
        console.warn("⚠️ _fbp cookie not found, trying alternative method")
        document.cookie = `_fbp=${fbpValue}; path=/; SameSite=Lax`
      }

      if (!currentCookies.includes("_fbc")) {
        console.warn("⚠️ _fbc cookie not found, trying alternative method")
        document.cookie = `_fbc=${fbcValue}; path=/; SameSite=Lax`
      }
    }, 100)
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
      // 1. Створюємо cookies ПЕРЕД ініціалізацією
      createFacebookCookies()

      // 2. Ініціалізуємо fbq функцію
      if (!window.fbq) {
        console.log("🔧 Creating fbq function...")

        // Створюємо функцію fbq
        window.fbq = function fbq() {
          if (window.fbq.callMethod) {
            window.fbq.callMethod.apply(window.fbq, arguments)
          } else {
            window.fbq.queue.push(arguments)
          }
        }

        // Налаштовуємо властивості
        window.fbq.push = window.fbq
        window.fbq.loaded = true
        window.fbq.version = "2.0"
        window.fbq.queue = []
        window.fbq.callMethod = null

        if (!window._fbq) window._fbq = window.fbq
      }

      // 3. Завантажуємо скрипт
      console.log("📥 Loading Facebook Pixel script...")
      const script = document.createElement("script")
      script.async = true
      script.src = "https://connect.facebook.net/en_US/fbevents.js"
      script.id = "facebook-pixel-script"

      script.onload = () => {
        console.log("✅ Facebook Pixel script loaded successfully")

        // Чекаємо, поки скрипт повністю ініціалізується
        setTimeout(() => {
          try {
            // 4. Ініціалізуємо pixel з додатковими параметрами
            console.log("🎯 Initializing pixel with advanced options...")

            window.fbq("init", pixelId, {
              external_id: `user_${Date.now()}`,
              agent: "plnextjs",
            })

            // 5. Відправляємо початкові події
            console.log("📊 Sending initial PageView...")
            window.fbq("track", "PageView", {
              source: "dynamic_initialization",
              page_url: window.location.href,
              page_title: document.title,
            })

            // 6. Відправляємо додаткові події для активації
            setTimeout(() => {
              console.log("📊 Sending activation events...")

              window.fbq("track", "ViewContent", {
                content_type: "website",
                source: "dynamic_initialization",
                value: 0.01,
                currency: "CZK",
              })

              window.fbq("trackCustom", "CookieConsentGranted", {
                consent_method: "banner",
                timestamp: new Date().toISOString(),
                pixel_id: pixelId,
              })

              // Відправляємо через noscript метод для надійності
              const img = new Image()
              img.height = 1
              img.width = 1
              img.style.display = "none"
              img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1&cd[source]=dynamic&cd[timestamp]=${Date.now()}`
              document.body.appendChild(img)

              console.log("📊 All activation events sent")
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
          } catch (error) {
            console.error("❌ Error during pixel initialization:", error)
            initializationAttempted.current = false
          }
        }, 500)
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

    // Основна подія PageView
    window.fbq("track", "PageView", {
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
    })

    // Додаткові події залежно від типу сторінки
    if (pathname.includes("/contact")) {
      window.fbq("track", "Contact", {
        content_category: "contact_page",
      })
    } else if (pathname.includes("/models/")) {
      window.fbq("track", "ViewContent", {
        content_type: "product",
        content_category: "device_model",
        value: 0.01,
        currency: "CZK",
      })
    } else if (pathname.includes("/brands/")) {
      window.fbq("track", "ViewContent", {
        content_type: "category",
        content_category: "device_brand",
        value: 0.01,
        currency: "CZK",
      })
    }

    // Кастомна подія навігації
    window.fbq("trackCustom", "PageNavigation", {
      from_page: previousPathname.current,
      to_page: pathname,
      timestamp: new Date().toISOString(),
    })

    // Додатково відправляємо через noscript
    const img = new Image()
    img.height = 1
    img.width = 1
    img.style.display = "none"
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1&cd[page]=${encodeURIComponent(pathname)}&cd[timestamp]=${Date.now()}`
    document.body.appendChild(img)

    // Видаляємо img через 5 секунд
    setTimeout(() => {
      if (document.body.contains(img)) {
        document.body.removeChild(img)
      }
    }, 5000)
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

      // Якщо згода змінилась на true або ще не ініціалізовано
      if (consentChanged || !isInitialized) {
        console.log("🚀 Starting initialization...")
        // Невелика затримка для стабільності
        setTimeout(() => {
          initializeFacebookPixel()
        }, 200)
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
      }, 200)
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
        console.log("fbq loaded:", window.fbq?.loaded)
        console.log("Global flag:", window.FB_PIXEL_INITIALIZED)
        console.log("Current cookies:", document.cookie)

        if (window.fbq) {
          const testId = Math.random().toString(36).substring(7)

          // Відправляємо різні типи подій для тестування
          window.fbq("trackCustom", "ManualTest", {
            timestamp: new Date().toISOString(),
            source: "manual_test",
            test_id: testId,
          })

          window.fbq("track", "Purchase", {
            value: 1,
            currency: "CZK",
            content_type: "test",
            source: "manual_test",
          })

          window.fbq("track", "ViewContent", {
            content_type: "test",
            value: 1,
            currency: "CZK",
          })

          console.log(`✅ Test events sent with ID: ${testId}`)

          // Додатково через noscript
          const img = new Image()
          img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=Purchase&noscript=1&cd[test]=manual&cd[test_id]=${testId}&cd[timestamp]=${Date.now()}`
          document.body.appendChild(img)

          setTimeout(() => {
            if (document.body.contains(img)) {
              document.body.removeChild(img)
            }
          }, 5000)
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
