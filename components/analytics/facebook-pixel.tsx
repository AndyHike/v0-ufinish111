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
    FB_PIXEL_INITIALIZED: boolean
  }
}

export function FacebookPixel({ pixelId, consent }: FacebookPixelProps) {
  const isInitialized = useRef(false)
  const scriptLoaded = useRef(false)
  const pathname = usePathname()
  const previousPathname = useRef(pathname)
  const consentRef = useRef(consent)

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

    isInitialized.current = false
    scriptLoaded.current = false
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

  // Функція для динамічного завантаження Facebook Pixel скрипта
  const loadFacebookPixelScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (scriptLoaded.current) {
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
        scriptLoaded.current = true
        resolve()
      }

      script.onerror = (error) => {
        console.error("❌ Failed to load Facebook Pixel script:", error)
        scriptLoaded.current = false
        reject(error)
      }

      document.head.appendChild(script)
    })
  }

  // Функція для ініціалізації Facebook Pixel
  const initializeFacebookPixel = async () => {
    if (!pixelId || isInitialized.current || window.FB_PIXEL_INITIALIZED) {
      console.log("🔄 Facebook Pixel already initialized or missing pixelId")
      return
    }

    console.log(`🚀 Initializing Facebook Pixel with ID: ${pixelId}`)

    try {
      // Завантажуємо скрипт динамічно
      await loadFacebookPixelScript()

      // Ініціалізуємо fbq функцію якщо її немає
      if (!window.fbq) {
        console.log("🔧 Creating fbq function...")
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

      // Створюємо cookies вручну перед ініціалізацією
      createFacebookCookies()

      // Ініціалізуємо pixel
      console.log("🎯 Initializing Facebook Pixel...")
      window.fbq("init", pixelId)

      // Відправляємо PageView для поточної сторінки
      console.log("📊 Sending initial PageView...")
      window.fbq("track", "PageView")

      // Додаткові події для активації cookies
      setTimeout(() => {
        console.log("📊 Sending additional events...")

        window.fbq("track", "ViewContent", {
          content_type: "website",
          source: "dynamic_initialization",
          page_url: window.location.href,
          page_title: document.title,
        })

        window.fbq("trackCustom", "CookieConsentGranted", {
          consent_method: "banner",
          timestamp: new Date().toISOString(),
          page_url: window.location.href,
        })

        // Перевіряємо чи створились cookies
        setTimeout(() => {
          const cookies = document.cookie
          console.log("🍪 Current cookies after FB init:", cookies)
          if (cookies.includes("_fbp") || cookies.includes("_fbc")) {
            console.log("✅ Facebook cookies created successfully")
          } else {
            console.warn("⚠️ Facebook cookies not found, creating manually...")
            createFacebookCookies()
          }
        }, 1000)
      }, 500)

      isInitialized.current = true
      window.FB_PIXEL_INITIALIZED = true
      console.log(`✅ Facebook Pixel ${pixelId} initialized successfully`)

      // Диспатчимо кастомну подію для повідомлення інших компонентів
      window.dispatchEvent(
        new CustomEvent("facebookPixelInitialized", {
          detail: { pixelId, timestamp: Date.now() },
        }),
      )
    } catch (error) {
      console.error("❌ Failed to initialize Facebook Pixel:", error)
    }
  }

  // Функція для відстеження переходів по сторінках
  const trackPageView = () => {
    if (!window.fbq || !isInitialized.current) {
      console.log("⚠️ Cannot track page view - pixel not initialized")
      return
    }

    console.log(`📊 Tracking page view: ${pathname}`)

    // Відправляємо PageView для нової сторінки
    window.fbq("track", "PageView")

    // Додаткові події залежно від типу сторінки
    if (pathname.includes("/contact")) {
      window.fbq("track", "Contact")
    } else if (pathname.includes("/models/")) {
      window.fbq("track", "ViewContent", {
        content_type: "product",
        content_category: "device_model",
        page_url: window.location.href,
      })
    } else if (pathname.includes("/brands/")) {
      window.fbq("track", "ViewContent", {
        content_type: "category",
        content_category: "device_brand",
        page_url: window.location.href,
      })
    } else if (pathname.includes("/series/")) {
      window.fbq("track", "ViewContent", {
        content_type: "category",
        content_category: "device_series",
        page_url: window.location.href,
      })
    }

    // Відправляємо кастомну подію з деталями сторінки
    window.fbq("trackCustom", "PageNavigation", {
      from_page: previousPathname.current,
      to_page: pathname,
      page_title: document.title,
      timestamp: new Date().toISOString(),
    })
  }

  // Ефект для ініціалізації при зміні згоди
  useEffect(() => {
    console.log(`🔄 Consent changed: ${consentRef.current} -> ${consent}, pixelId: ${pixelId}`)

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
        isInitialized.current = false
        window.FB_PIXEL_INITIALIZED = false
      }

      // Ініціалізуємо негайно
      initializeFacebookPixel()
    } else {
      console.log("🔴 Facebook Pixel consent denied - clearing cookies")
      forceClearFacebookCookies()
    }
  }, [pixelId, consent])

  // Ефект для відстеження переходів по сторінках
  useEffect(() => {
    if (consent && isInitialized.current && pathname !== previousPathname.current) {
      console.log(`🔄 Page changed from ${previousPathname.current} to ${pathname}`)

      // Невелика затримка для завантаження сторінки
      setTimeout(() => {
        trackPageView()
      }, 100)

      previousPathname.current = pathname
    }
  }, [pathname, consent])

  // Ефект для додаткової активації через noscript img
  useEffect(() => {
    if (consent && pixelId && isInitialized.current) {
      // Створюємо прихований img для активації без JS
      const img = document.createElement("img")
      img.height = 1
      img.width = 1
      img.style.display = "none"
      img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1&cd[consent]=granted&cd[timestamp]=${Date.now()}&cd[page]=${encodeURIComponent(pathname)}`

      document.body.appendChild(img)

      // Видаляємо через 5 секунд
      setTimeout(() => {
        if (document.body.contains(img)) {
          document.body.removeChild(img)
        }
      }, 5000)
    }
  }, [consent, pixelId, pathname, isInitialized.current])

  // Додаємо глобальну функцію для тестування
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.testFacebookPixel = () => {
        console.log("🧪 Testing Facebook Pixel...")
        console.log("Consent:", consent)
        console.log("Pixel ID:", pixelId)
        console.log("Initialized:", isInitialized.current)
        console.log("Script loaded:", scriptLoaded.current)
        console.log("fbq available:", !!window.fbq)
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
  }, [consent, pixelId])

  return null
}
