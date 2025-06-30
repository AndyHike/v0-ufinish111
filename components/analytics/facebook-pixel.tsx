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
  const scriptLoadedRef = useRef(false)

  // Функція для повного очищення Facebook ресурсів
  const clearFacebookResources = () => {
    if (typeof document === "undefined") return

    console.log("🧹 Completely clearing Facebook resources...")

    // Очищення cookies для всіх можливих доменів
    const facebookCookies = ["_fbp", "_fbc", "fr", "_gcl_aw", "_gcl_dc"]
    const domains = [
      "",
      window.location.hostname,
      "." + window.location.hostname,
      ".devicehelp.cz",
      "devicehelp.cz",
      ".www.devicehelp.cz",
      "www.devicehelp.cz",
    ]
    const paths = ["/", "/admin", "/auth"]

    facebookCookies.forEach((cookieName) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
          const clearVariants = [
            `${cookieName}=; expires=${expireDate}; path=${path}`,
            `${cookieName}=deleted; expires=${expireDate}; path=${path}`,
            `${cookieName}=; max-age=0; path=${path}`,
          ]

          if (domain) {
            clearVariants.forEach((variant) => {
              document.cookie = `${variant}; domain=${domain}`
              document.cookie = `${variant}; domain=${domain}; SameSite=Lax`
              document.cookie = `${variant}; domain=${domain}; SameSite=None; Secure`
            })
          } else {
            clearVariants.forEach((variant) => {
              document.cookie = variant
              document.cookie = `${variant}; SameSite=Lax`
            })
          }
        })
      })
    })

    // Очищення глобальних змінних
    if (typeof window !== "undefined") {
      delete window.fbq
      delete window._fbq
      window.FB_PIXEL_INITIALIZED = false
    }

    // Видалення всіх Facebook скриптів
    const existingScripts = document.querySelectorAll(
      'script[src*="fbevents.js"], script[src*="facebook"], script[id*="facebook"]',
    )
    existingScripts.forEach((script) => script.remove())

    // Очищення localStorage та sessionStorage
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("facebook") || key.includes("_fb") || key.startsWith("fbp")) {
          localStorage.removeItem(key)
        }
      })
      Object.keys(sessionStorage).forEach((key) => {
        if (key.includes("facebook") || key.includes("_fb") || key.startsWith("fbp")) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn("Could not clear storage:", error)
    }

    setIsInitialized(false)
    initializationAttempted.current = false
    scriptLoadedRef.current = false
  }

  // Функція для створення правильних Facebook cookies
  const createOptimizedFacebookCookies = () => {
    if (typeof document === "undefined") return

    console.log("🍪 Creating optimized Facebook cookies...")

    const currentDomain = window.location.hostname
    const baseDomain = currentDomain.replace(/^www\./, "")

    // Створюємо _fbp cookie (Facebook Browser Pixel)
    const fbpValue = `fb.1.${Date.now()}.${Math.random().toString(36).substring(2, 15)}`
    const fbpExpires = new Date()
    fbpExpires.setFullYear(fbpExpires.getFullYear() + 1)

    // Створюємо для базового домену (без www)
    const fbpCookie = `_fbp=${fbpValue}; expires=${fbpExpires.toUTCString()}; path=/; domain=.${baseDomain}; SameSite=Lax`
    document.cookie = fbpCookie
    console.log("🍪 Created _fbp cookie:", fbpCookie)

    // Створюємо _fbc cookie (Facebook Click ID)
    const fbcValue = `fb.1.${Date.now()}.${pixelId}`
    const fbcExpires = new Date()
    fbcExpires.setDate(fbcExpires.getDate() + 7)

    const fbcCookie = `_fbc=${fbcValue}; expires=${fbcExpires.toUTCString()}; path=/; domain=.${baseDomain}; SameSite=Lax`
    document.cookie = fbcCookie
    console.log("🍪 Created _fbc cookie:", fbcCookie)

    // Перевіряємо створення через 200мс
    setTimeout(() => {
      const currentCookies = document.cookie
      console.log("🍪 Verification - Current cookies:", currentCookies)

      if (!currentCookies.includes("_fbp")) {
        console.warn("⚠️ _fbp cookie not found, trying fallback")
        document.cookie = `_fbp=${fbpValue}; path=/; SameSite=Lax`
      }

      if (!currentCookies.includes("_fbc")) {
        console.warn("⚠️ _fbc cookie not found, trying fallback")
        document.cookie = `_fbc=${fbcValue}; path=/; SameSite=Lax`
      }
    }, 200)
  }

  // Функція для завантаження Facebook Pixel скрипта
  const loadFacebookPixelScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (scriptLoadedRef.current) {
        console.log("📥 Facebook Pixel script already loaded")
        resolve()
        return
      }

      console.log("📥 Loading Facebook Pixel script...")

      // Видаляємо існуючі скрипти
      const existingScripts = document.querySelectorAll('script[src*="fbevents.js"]')
      existingScripts.forEach((script) => script.remove())

      const script = document.createElement("script")
      script.async = true
      script.defer = true
      script.src = "https://connect.facebook.net/en_US/fbevents.js"
      script.id = "facebook-pixel-script"
      script.crossOrigin = "anonymous"

      script.onload = () => {
        console.log("✅ Facebook Pixel script loaded successfully")
        scriptLoadedRef.current = true
        resolve()
      }

      script.onerror = (error) => {
        console.error("❌ Failed to load Facebook Pixel script:", error)
        scriptLoadedRef.current = false
        reject(error)
      }

      // Додаємо скрипт до head
      document.head.appendChild(script)
    })
  }

  // Основна функція ініціалізації Facebook Pixel
  const initializeFacebookPixel = async () => {
    if (!pixelId || isInitialized || initializationAttempted.current) {
      console.log("🔄 Facebook Pixel initialization skipped - already in progress or completed")
      return
    }

    console.log(`🚀 Starting Facebook Pixel initialization with ID: ${pixelId}`)
    initializationAttempted.current = true

    try {
      // Крок 1: Створюємо cookies ПЕРЕД завантаженням скрипта
      createOptimizedFacebookCookies()

      // Крок 2: Ініціалізуємо fbq функцію
      if (!window.fbq) {
        console.log("🔧 Initializing fbq function...")

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
        window.fbq.callMethod = null

        if (!window._fbq) window._fbq = window.fbq
      }

      // Крок 3: Завантажуємо скрипт
      await loadFacebookPixelScript()

      // Крок 4: Чекаємо повного завантаження
      let attempts = 0
      const maxAttempts = 30
      while ((!window.fbq || !window.fbq.callMethod) && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        attempts++
      }

      if (!window.fbq || !window.fbq.callMethod) {
        throw new Error("Facebook Pixel script not properly loaded after waiting")
      }

      // Крок 5: Ініціалізуємо pixel з правильними параметрами
      console.log("🎯 Initializing Facebook Pixel...")

      window.fbq("init", pixelId, {
        external_id: `user_${Date.now()}`,
        agent: "plnextjs",
        autoConfig: true,
        debug: false,
      })

      // Крок 6: Відправляємо початкові події з затримками
      console.log("📊 Sending initial PageView event...")

      window.fbq("track", "PageView", {
        source: "dynamic_initialization",
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer || "",
        timestamp: Date.now(),
      })

      // Чекаємо 1 секунду перед додатковими подіями
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Відправляємо ViewContent для активації
      console.log("📊 Sending ViewContent activation event...")
      window.fbq("track", "ViewContent", {
        content_type: "website",
        source: "dynamic_initialization",
        value: 0.01,
        currency: "CZK",
        content_name: document.title,
        content_category: "website",
      })

      // Чекаємо ще 500мс
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Відправляємо кастомну подію про згоду
      console.log("📊 Sending consent event...")
      window.fbq("trackCustom", "CookieConsentGranted", {
        consent_method: "banner",
        timestamp: new Date().toISOString(),
        pixel_id: pixelId,
        page_url: window.location.href,
      })

      // Крок 7: Додатково відправляємо через noscript метод
      const noscriptImg = new Image()
      noscriptImg.height = 1
      noscriptImg.width = 1
      noscriptImg.style.display = "none"
      noscriptImg.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1&cd[source]=dynamic_init&cd[timestamp]=${Date.now()}&cd[url]=${encodeURIComponent(window.location.href)}`

      noscriptImg.onload = () => {
        console.log("📡 Noscript image loaded successfully")
      }

      noscriptImg.onerror = () => {
        console.warn("⚠️ Noscript image failed to load")
      }

      document.body.appendChild(noscriptImg)

      // Видаляємо noscript img через 10 секунд
      setTimeout(() => {
        if (document.body.contains(noscriptImg)) {
          document.body.removeChild(noscriptImg)
        }
      }, 10000)

      // Крок 8: Встановлюємо флаги успішної ініціалізації
      setIsInitialized(true)
      window.FB_PIXEL_INITIALIZED = true

      console.log(`✅ Facebook Pixel ${pixelId} initialized successfully`)

      // Крок 9: Диспатчимо подію про успішну ініціалізацію
      window.dispatchEvent(
        new CustomEvent("facebookPixelInitialized", {
          detail: {
            pixelId,
            timestamp: Date.now(),
            cookies: document.cookie,
            url: window.location.href,
          },
        }),
      )

      // Крок 10: Додаткова перевірка через 2 секунди
      setTimeout(() => {
        const cookieCheck = document.cookie
        console.log("🔍 Final cookie verification:", cookieCheck)

        if (!cookieCheck.includes("_fbp") || !cookieCheck.includes("_fbc")) {
          console.warn("⚠️ Cookies missing after initialization, recreating...")
          createOptimizedFacebookCookies()
        }
      }, 2000)
    } catch (error) {
      console.error("❌ Facebook Pixel initialization failed:", error)
      initializationAttempted.current = false

      // Повторна спроба через 3 секунди
      setTimeout(() => {
        if (consent && !isInitialized) {
          console.log("🔄 Retrying Facebook Pixel initialization...")
          initializationAttempted.current = false
          initializeFacebookPixel()
        }
      }, 3000)
    }
  }

  // Функція для відстеження переходів по сторінках
  const trackPageView = () => {
    if (!window.fbq || !isInitialized) {
      console.log("⚠️ Cannot track page view - pixel not initialized")
      return
    }

    console.log(`📊 Tracking page view: ${pathname}`)

    // Основна подія PageView з повними параметрами
    window.fbq("track", "PageView", {
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer || "",
      timestamp: Date.now(),
    })

    // Специфічні події залежно від типу сторінки
    if (pathname.includes("/contact")) {
      window.fbq("track", "Contact", {
        content_category: "contact_page",
        page_url: window.location.href,
      })
    } else if (pathname.includes("/models/")) {
      const modelName = pathname.split("/models/")[1] || "unknown"
      window.fbq("track", "ViewContent", {
        content_type: "product",
        content_category: "device_model",
        content_name: modelName,
        value: 0.01,
        currency: "CZK",
        page_url: window.location.href,
      })
    } else if (pathname.includes("/brands/")) {
      const brandName = pathname.split("/brands/")[1] || "unknown"
      window.fbq("track", "ViewContent", {
        content_type: "category",
        content_category: "device_brand",
        content_name: brandName,
        value: 0.01,
        currency: "CZK",
        page_url: window.location.href,
      })
    } else if (pathname.includes("/series/")) {
      const seriesName = pathname.split("/series/")[1] || "unknown"
      window.fbq("track", "ViewContent", {
        content_type: "category",
        content_category: "device_series",
        content_name: seriesName,
        value: 0.01,
        currency: "CZK",
        page_url: window.location.href,
      })
    }

    // Кастомна подія навігації
    window.fbq("trackCustom", "PageNavigation", {
      from_page: previousPathname.current,
      to_page: pathname,
      page_title: document.title,
      timestamp: new Date().toISOString(),
      session_id: `session_${Date.now()}`,
    })

    // Додатково через noscript для надійності
    const navImg = new Image()
    navImg.height = 1
    navImg.width = 1
    navImg.style.display = "none"
    navImg.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1&cd[page]=${encodeURIComponent(pathname)}&cd[timestamp]=${Date.now()}&cd[title]=${encodeURIComponent(document.title)}`

    document.body.appendChild(navImg)

    setTimeout(() => {
      if (document.body.contains(navImg)) {
        document.body.removeChild(navImg)
      }
    }, 5000)
  }

  // Основний ефект для обробки згоди
  useEffect(() => {
    console.log(`🔄 Consent effect triggered: ${consentRef.current} -> ${consent}, pixelId: ${pixelId}`)

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
        console.log("🚀 Starting Facebook Pixel initialization...")

        // Невелика затримка для стабільності DOM
        setTimeout(() => {
          initializeFacebookPixel()
        }, 300)
      }
    } else {
      console.log("🔴 Facebook Pixel consent denied - clearing all resources")
      clearFacebookResources()
    }
  }, [pixelId, consent])

  // Ефект для відстеження переходів по сторінках
  useEffect(() => {
    if (consent && isInitialized && pathname !== previousPathname.current) {
      console.log(`🔄 Page navigation detected: ${previousPathname.current} -> ${pathname}`)

      // Затримка для завантаження нової сторінки
      setTimeout(() => {
        trackPageView()
      }, 300)

      previousPathname.current = pathname
    }
  }, [pathname, consent, isInitialized])

  // Глобальна функція для тестування
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.testFacebookPixel = () => {
        console.log("🧪 === Facebook Pixel Test ===")
        console.log("Consent:", consent)
        console.log("Pixel ID:", pixelId)
        console.log("Initialized:", isInitialized)
        console.log("Script loaded:", scriptLoadedRef.current)
        console.log("fbq available:", !!window.fbq)
        console.log("fbq loaded:", window.fbq?.loaded)
        console.log("fbq callMethod:", !!window.fbq?.callMethod)
        console.log("Global flag:", window.FB_PIXEL_INITIALIZED)
        console.log("Current URL:", window.location.href)
        console.log("Current cookies:", document.cookie)

        if (window.fbq && window.fbq.callMethod) {
          const testId = Math.random().toString(36).substring(7)
          console.log(`🧪 Sending test events with ID: ${testId}`)

          // Відправляємо різні типи подій для тестування
          window.fbq("trackCustom", "ManualTest", {
            timestamp: new Date().toISOString(),
            source: "manual_test",
            test_id: testId,
            page_url: window.location.href,
            user_agent: navigator.userAgent,
          })

          window.fbq("track", "Purchase", {
            value: 1.99,
            currency: "CZK",
            content_type: "test_purchase",
            source: "manual_test",
            test_id: testId,
          })

          window.fbq("track", "ViewContent", {
            content_type: "test_content",
            content_name: "Manual Test Content",
            value: 1,
            currency: "CZK",
            test_id: testId,
          })

          window.fbq("track", "Lead", {
            content_name: "Manual Test Lead",
            source: "manual_test",
            test_id: testId,
          })

          console.log(`✅ Test events sent successfully with ID: ${testId}`)

          // Додатково через noscript
          const testImg = new Image()
          testImg.src = `https://www.facebook.com/tr?id=${pixelId}&ev=Purchase&noscript=1&cd[test]=manual&cd[test_id]=${testId}&cd[timestamp]=${Date.now()}&cd[value]=1.99&cd[currency]=CZK`
          document.body.appendChild(testImg)

          setTimeout(() => {
            if (document.body.contains(testImg)) {
              document.body.removeChild(testImg)
            }
          }, 5000)

          console.log("📡 Noscript test event also sent")
        } else {
          console.log("❌ fbq not properly available for testing")
          console.log("fbq object:", window.fbq)
        }
      }
    }
  }, [consent, pixelId, isInitialized])

  // Слухаємо події зміни згоди
  useEffect(() => {
    const handleConsentChange = (event: CustomEvent) => {
      console.log("🔄 Received consent change event:", event.detail)

      if (event.detail.consent.marketing && !consent) {
        console.log("🚀 Marketing consent granted via event - forcing initialization")
        setTimeout(() => {
          if (!isInitialized && !initializationAttempted.current) {
            initializeFacebookPixel()
          }
        }, 200)
      }
    }

    window.addEventListener("cookieConsentChanged", handleConsentChange as EventListener)

    return () => {
      window.removeEventListener("cookieConsentChanged", handleConsentChange as EventListener)
    }
  }, [consent, isInitialized])

  return null
}
