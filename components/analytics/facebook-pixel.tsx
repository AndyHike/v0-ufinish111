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
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [serverConnected, setServerConnected] = useState(false)
  const pathname = usePathname()
  const previousPathname = useRef(pathname)
  const consentRef = useRef(consent)
  const initializationAttempted = useRef(false)
  const connectionCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // Функція для агресивного очищення Facebook cookies
  const forceClearFacebookCookies = () => {
    if (typeof document === "undefined") return

    console.log("🧹 Clearing Facebook cookies...")

    const facebookCookies = ["_fbp", "_fbc", "fr", "_gcl_aw", "_gcl_dc", "_gcl_gb", "_gcl_gf", "_gcl_ha"]
    const domains = ["", window.location.hostname, "." + window.location.hostname, ".devicehelp.cz", "devicehelp.cz"]
    const paths = ["/", "/admin", "/auth", ""]

    facebookCookies.forEach((cookieName) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
          const maxAgeZero = "max-age=0"

          const clearVariants = [
            `${cookieName}=; expires=${expireDate}; path=${path}`,
            `${cookieName}=; ${maxAgeZero}; path=${path}`,
            `${cookieName}=deleted; expires=${expireDate}; path=${path}`,
            `${cookieName}=deleted; ${maxAgeZero}; path=${path}`,
          ]

          if (domain) {
            clearVariants.forEach((variant) => {
              document.cookie = `${variant}; domain=${domain}`
              document.cookie = `${variant}; domain=${domain}; SameSite=Lax`
              document.cookie = `${variant}; domain=${domain}; SameSite=None; Secure`
            })
          }

          clearVariants.forEach((variant) => {
            document.cookie = variant
            document.cookie = `${variant}; SameSite=Lax`
            document.cookie = `${variant}; SameSite=None; Secure`
          })
        })
      })
    })

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
      console.warn("Could not clear Facebook storage:", error)
    }

    // Очищення глобальних змінних
    if (typeof window !== "undefined") {
      delete window.fbq
      delete window._fbq
      window.FB_PIXEL_INITIALIZED = false
    }

    // Видалення існуючих скриптів
    const existingScripts = document.querySelectorAll('script[src*="fbevents.js"]')
    existingScripts.forEach((script) => script.remove())

    // Очищення інтервалів
    if (connectionCheckInterval.current) {
      clearInterval(connectionCheckInterval.current)
      connectionCheckInterval.current = null
    }

    setIsInitialized(false)
    setScriptLoaded(false)
    setServerConnected(false)
    initializationAttempted.current = false
  }

  // Функція для створення _fbp cookie вручну
  const createFacebookCookies = () => {
    if (typeof document === "undefined") return

    console.log("🍪 Creating Facebook cookies manually...")

    // Створюємо _fbp cookie якщо його немає
    if (!document.cookie.includes("_fbp=")) {
      const fbpValue = `fb.1.${Date.now()}.${Math.random().toString(36).substring(2, 15)}`
      const expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1) // 1 рік

      const cookieString = `_fbp=${fbpValue}; expires=${expires.toUTCString()}; path=/; domain=${window.location.hostname}; SameSite=Lax`
      document.cookie = cookieString

      console.log("🍪 Created _fbp cookie:", cookieString)
    }

    // Створюємо _fbc cookie якщо його немає
    if (!document.cookie.includes("_fbc=")) {
      const fbcValue = `fb.1.${Date.now()}.${pixelId}`
      const expires = new Date()
      expires.setDate(expires.getDate() + 7) // 7 днів

      const cookieString = `_fbc=${fbcValue}; expires=${expires.toUTCString()}; path=/; domain=${window.location.hostname}; SameSite=Lax`
      document.cookie = cookieString

      console.log("🍪 Created _fbc cookie:", cookieString)
    }
  }

  // Функція для перевірки з'єднання з Facebook серверами
  const checkFacebookConnection = () => {
    return new Promise<boolean>((resolve) => {
      const img = new Image()
      const timeout = setTimeout(() => {
        resolve(false)
      }, 5000) // 5 секунд таймаут

      img.onload = () => {
        clearTimeout(timeout)
        resolve(true)
      }

      img.onerror = () => {
        clearTimeout(timeout)
        resolve(false)
      }

      // Тестуємо з'єднання з Facebook
      img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1&t=${Date.now()}`
    })
  }

  // Функція для динамічного завантаження Facebook Pixel скрипта
  const loadFacebookPixelScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (scriptLoaded) {
        console.log("📥 Facebook Pixel script already loaded")
        resolve()
        return
      }

      console.log("📥 Loading Facebook Pixel script dynamically...")

      // Видаляємо існуючі скрипти
      const existingScripts = document.querySelectorAll('script[src*="fbevents.js"]')
      existingScripts.forEach((script) => script.remove())

      // Створюємо новий скрипт
      const script = document.createElement("script")
      script.async = true
      script.src = `https://connect.facebook.net/en_US/fbevents.js?t=${Date.now()}`
      script.id = "facebook-pixel-script"

      script.onload = () => {
        console.log("✅ Facebook Pixel script loaded successfully")
        setScriptLoaded(true)
        resolve()
      }

      script.onerror = (error) => {
        console.error("❌ Failed to load Facebook Pixel script:", error)
        setScriptLoaded(false)
        reject(error)
      }

      document.head.appendChild(script)
    })
  }

  // Функція для ініціалізації Facebook Pixel з повною перевіркою
  const initializeFacebookPixel = async () => {
    if (!pixelId || isInitialized || window.FB_PIXEL_INITIALIZED) {
      console.log("🔄 Facebook Pixel already initialized or missing pixelId")
      return
    }

    console.log(`🚀 Initializing Facebook Pixel with ID: ${pixelId}`)
    initializationAttempted.current = true

    try {
      // 1. Перевіряємо з'єднання з Facebook серверами
      console.log("🔗 Checking connection to Facebook servers...")
      const connectionOk = await checkFacebookConnection()
      if (!connectionOk) {
        console.warn("⚠️ Cannot connect to Facebook servers, but continuing...")
      } else {
        console.log("✅ Connection to Facebook servers OK")
        setServerConnected(true)
      }

      // 2. Завантажуємо скрипт динамічно
      await loadFacebookPixelScript()

      // 3. Чекаємо повного завантаження скрипта
      let attempts = 0
      const maxAttempts = 50 // 5 секунд
      while (!window.fbq && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        attempts++
      }

      if (!window.fbq) {
        throw new Error("Facebook Pixel script failed to load properly")
      }

      // 4. Ініціалізуємо fbq функцію якщо її немає
      if (!window.fbq.loaded) {
        console.log("🔧 Configuring fbq function...")
        window.fbq = function fbq() {
          if (window.fbq.callMethod) {
            window.fbq.callMethod.apply(window.fbq, arguments)
          } else {
            window.fbq.queue.push(arguments)
          }
        }
        if (!window._fbq) window._fbq = window.fbq
        window.fbq.push = window.fbq
        window.fbq.loaded = true
        window.fbq.version = "2.0"
        window.fbq.queue = []
      }

      // 5. Створюємо cookies вручну перед ініціалізацією
      createFacebookCookies()

      // 6. Ініціалізуємо pixel з додатковими параметрами
      console.log("🎯 Initializing Facebook Pixel...")
      window.fbq("init", pixelId, {
        external_id: `user_${Date.now()}`,
        em: undefined, // email hash якщо є
        ph: undefined, // phone hash якщо є
      })

      // 7. Відправляємо початкові події з затримками для надійності
      console.log("📊 Sending initial events...")

      // PageView з додатковими параметрами
      window.fbq("track", "PageView", {
        source: "dynamic_initialization",
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer,
        timestamp: Date.now(),
      })

      // Чекаємо 1 секунду перед наступними подіями
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // ViewContent подія
      window.fbq("track", "ViewContent", {
        content_type: "website",
        source: "dynamic_initialization",
        page_url: window.location.href,
        page_title: document.title,
        value: 1,
        currency: "CZK",
      })

      // Чекаємо ще 500мс
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Кастомна подія про згоду
      window.fbq("trackCustom", "CookieConsentGranted", {
        consent_method: "banner",
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        pixel_id: pixelId,
      })

      // 8. Додаткові заходи для активації
      // Відправляємо через noscript метод
      const img = new Image()
      img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1&cd[source]=dynamic_init&cd[timestamp]=${Date.now()}`

      // 9. Перевіряємо чи створились cookies
      setTimeout(() => {
        const cookies = document.cookie
        console.log("🍪 Current cookies after FB init:", cookies)
        if (cookies.includes("_fbp") || cookies.includes("_fbc")) {
          console.log("✅ Facebook cookies created successfully")
        } else {
          console.warn("⚠️ Facebook cookies not found, creating manually...")
          createFacebookCookies()
        }
      }, 2000)

      // 10. Встановлюємо періодичну перевірку з'єднання
      connectionCheckInterval.current = setInterval(async () => {
        const connected = await checkFacebookConnection()
        setServerConnected(connected)
        if (connected && !serverConnected) {
          console.log("🔗 Facebook connection restored, sending test event")
          window.fbq("trackCustom", "ConnectionRestored", {
            timestamp: new Date().toISOString(),
          })
        }
      }, 30000) // Перевіряємо кожні 30 секунд

      setIsInitialized(true)
      window.FB_PIXEL_INITIALIZED = true
      console.log(`✅ Facebook Pixel ${pixelId} initialized successfully`)

      // Диспатчимо кастомну подію для повідомлення інших компонентів
      window.dispatchEvent(
        new CustomEvent("facebookPixelInitialized", {
          detail: { pixelId, timestamp: Date.now(), serverConnected },
        }),
      )
    } catch (error) {
      console.error("❌ Failed to initialize Facebook Pixel:", error)
      initializationAttempted.current = false

      // Спробуємо ще раз через 5 секунд
      setTimeout(() => {
        if (consent && !isInitialized) {
          console.log("🔄 Retrying Facebook Pixel initialization...")
          initializationAttempted.current = false
          initializeFacebookPixel()
        }
      }, 5000)
    }
  }

  // Функція для відстеження переходів по сторінках
  const trackPageView = () => {
    if (!window.fbq || !isInitialized) {
      console.log("⚠️ Cannot track page view - pixel not initialized")
      return
    }

    console.log(`📊 Tracking page view: ${pathname}`)

    // Відправляємо PageView для нової сторінки з додатковими параметрами
    window.fbq("track", "PageView", {
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
    })

    // Додаткові події залежно від типу сторінки
    if (pathname.includes("/contact")) {
      window.fbq("track", "Contact", {
        content_category: "contact_page",
        page_url: window.location.href,
      })
    } else if (pathname.includes("/models/")) {
      window.fbq("track", "ViewContent", {
        content_type: "product",
        content_category: "device_model",
        page_url: window.location.href,
        value: 1,
        currency: "CZK",
      })
    } else if (pathname.includes("/brands/")) {
      window.fbq("track", "ViewContent", {
        content_type: "category",
        content_category: "device_brand",
        page_url: window.location.href,
        value: 1,
        currency: "CZK",
      })
    } else if (pathname.includes("/series/")) {
      window.fbq("track", "ViewContent", {
        content_type: "category",
        content_category: "device_series",
        page_url: window.location.href,
        value: 1,
        currency: "CZK",
      })
    }

    // Відправляємо кастомну подію з деталями сторінки
    window.fbq("trackCustom", "PageNavigation", {
      from_page: previousPathname.current,
      to_page: pathname,
      page_title: document.title,
      timestamp: new Date().toISOString(),
      server_connected: serverConnected,
    })

    // Додатково відправляємо через noscript метод
    const img = new Image()
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1&cd[page]=${encodeURIComponent(pathname)}&cd[timestamp]=${Date.now()}`
  }

  // Ефект для ініціалізації при зміні згоди
  useEffect(() => {
    console.log(`🔄 Consent effect triggered: ${consentRef.current} -> ${consent}, pixelId: ${pixelId}`)

    if (!pixelId) {
      console.log("⚠️ No pixelId provided")
      return
    }

    // Оновлюємо ref для відстеження змін
    const consentChanged = consentRef.current !== consent
    consentRef.current = consent

    if (consent) {
      console.log(`🟢 Facebook Pixel consent granted for ID: ${pixelId}`)

      // Якщо згода змінилась з false на true, очищуємо попередні ініціалізації
      if (consentChanged) {
        console.log("🔄 Consent changed to granted - reinitializing...")
        setIsInitialized(false)
        setServerConnected(false)
        window.FB_PIXEL_INITIALIZED = false
        initializationAttempted.current = false
      }

      // Ініціалізуємо негайно якщо ще не спробували
      if (!initializationAttempted.current) {
        console.log("🚀 Starting immediate initialization...")
        // Невелика затримка для стабільності
        setTimeout(() => {
          initializeFacebookPixel()
        }, 100)
      }
    } else {
      console.log("🔴 Facebook Pixel consent denied - clearing cookies")
      forceClearFacebookCookies()
    }
  }, [pixelId, consent])

  // Ефект для відстеження переходів по сторінках
  useEffect(() => {
    if (consent && isInitialized && pathname !== previousPathname.current) {
      console.log(`🔄 Page changed from ${previousPathname.current} to ${pathname}`)

      // Невелика затримка для завантаження сторінки
      setTimeout(() => {
        trackPageView()
      }, 200)

      previousPathname.current = pathname
    }
  }, [pathname, consent, isInitialized])

  // Додаємо глобальну функцію для тестування
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.testFacebookPixel = () => {
        console.log("🧪 Testing Facebook Pixel...")
        console.log("Consent:", consent)
        console.log("Pixel ID:", pixelId)
        console.log("Initialized:", isInitialized)
        console.log("Script loaded:", scriptLoaded)
        console.log("Server connected:", serverConnected)
        console.log("fbq available:", !!window.fbq)
        console.log("Global flag:", window.FB_PIXEL_INITIALIZED)
        console.log("Initialization attempted:", initializationAttempted.current)
        console.log("Cookies:", document.cookie)

        if (window.fbq) {
          // Відправляємо тестову подію з додатковими параметрами
          window.fbq("trackCustom", "ManualTest", {
            timestamp: new Date().toISOString(),
            source: "manual_test",
            test_id: Math.random().toString(36).substring(7),
            page_url: window.location.href,
            server_connected: serverConnected,
          })

          // Також відправляємо стандартну подію
          window.fbq("track", "ViewContent", {
            content_type: "test",
            source: "manual_test",
            value: 1,
            currency: "CZK",
          })

          console.log("✅ Test events sent")

          // Додатково відправляємо через noscript метод
          const img = new Image()
          img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=Purchase&noscript=1&cd[test]=manual&cd[timestamp]=${Date.now()}`
        } else {
          console.log("❌ fbq not available")
        }
      }
    }
  }, [consent, pixelId, isInitialized, scriptLoaded, serverConnected])

  // Слухаємо події зміни згоди
  useEffect(() => {
    const handleConsentChange = (event: CustomEvent) => {
      console.log("🔄 Received consent change event:", event.detail)

      if (event.detail.consent.marketing && !consent) {
        console.log("🚀 Marketing consent granted via event - forcing initialization")
        // Форсуємо ініціалізацію при отриманні події про згоду
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
      // Очищуємо інтервал при демонтажі компонента
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current)
      }
    }
  }, [consent, isInitialized])

  return null
}
