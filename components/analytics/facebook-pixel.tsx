"use client"

import { useEffect, useRef } from "react"

interface FacebookPixelProps {
  pixelId: string
  consent: boolean
}

declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: any
  }
}

export function FacebookPixel({ pixelId, consent }: FacebookPixelProps) {
  const isInitialized = useRef(false)
  const scriptLoaded = useRef(false)

  // Функція для агресивного очищення Facebook cookies
  const forceClearFacebookCookies = () => {
    if (typeof document === "undefined") return

    console.log("Clearing Facebook cookies...")

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

    // Створюємо _fbp cookie якщо його немає
    if (!document.cookie.includes("_fbp=")) {
      const fbpValue = `fb.1.${Date.now()}.${Math.random().toString(36).substring(2, 15)}`
      const expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1) // 1 рік

      const cookieString = `_fbp=${fbpValue}; expires=${expires.toUTCString()}; path=/; domain=${window.location.hostname}; SameSite=Lax`
      document.cookie = cookieString

      console.log("Created _fbp cookie manually:", cookieString)
    }

    // Створюємо _fbc cookie якщо його немає
    if (!document.cookie.includes("_fbc=")) {
      const fbcValue = `fb.1.${Date.now()}.${pixelId}`
      const expires = new Date()
      expires.setDate(expires.getDate() + 7) // 7 днів

      const cookieString = `_fbc=${fbcValue}; expires=${expires.toUTCString()}; path=/; domain=${window.location.hostname}; SameSite=Lax`
      document.cookie = cookieString

      console.log("Created _fbc cookie manually:", cookieString)
    }
  }

  // Функція для ініціалізації Facebook Pixel з оригінальним кодом
  const initializeFacebookPixel = () => {
    if (!pixelId || isInitialized.current) return

    console.log(`Initializing Facebook Pixel with ID: ${pixelId}`)

    // Оригінальний код Facebook Pixel
    !((f: any, b: any, e: any, v: any, n: any, t: any, s: any) => {
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

    // Чекаємо завантаження скрипта
    const checkFbqLoaded = () => {
      if (window.fbq && window.fbq.loaded) {
        console.log("Facebook Pixel script loaded, initializing...")

        // Створюємо cookies вручну перед ініціалізацією
        createFacebookCookies()

        // Ініціалізуємо pixel
        window.fbq("init", pixelId)
        window.fbq("track", "PageView")

        // Додаткові події для активації cookies
        setTimeout(() => {
          window.fbq("track", "ViewContent", {
            content_type: "website",
            source: "cookie_consent_activation",
          })

          window.fbq("trackCustom", "CookieConsentGranted", {
            consent_method: "banner",
            timestamp: new Date().toISOString(),
          })

          // Перевіряємо чи створились cookies
          setTimeout(() => {
            const cookies = document.cookie
            console.log("Current cookies after FB init:", cookies)
            if (cookies.includes("_fbp") || cookies.includes("_fbc")) {
              console.log("✅ Facebook cookies created successfully")
            } else {
              console.warn("⚠️ Facebook cookies not found, creating manually...")
              createFacebookCookies()
            }
          }, 1000)
        }, 500)

        isInitialized.current = true
        console.log(`✅ Facebook Pixel ${pixelId} initialized successfully`)
      } else {
        // Повторюємо перевірку через 100ms
        setTimeout(checkFbqLoaded, 100)
      }
    }

    checkFbqLoaded()
  }

  useEffect(() => {
    if (!pixelId) return

    if (consent) {
      console.log(`🟢 Facebook Pixel consent granted for ID: ${pixelId}`)

      // Очищуємо попередні ініціалізації
      isInitialized.current = false

      // Ініціалізуємо з затримкою
      setTimeout(() => {
        initializeFacebookPixel()
      }, 300)
    } else {
      console.log("🔴 Facebook Pixel consent denied - clearing cookies")
      forceClearFacebookCookies()
    }
  }, [pixelId, consent])

  // Додаємо noscript img для додаткової активації
  useEffect(() => {
    if (consent && pixelId) {
      // Створюємо прихований img для активації без JS
      const img = document.createElement("img")
      img.height = 1
      img.width = 1
      img.style.display = "none"
      img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1&cd[consent]=granted&cd[timestamp]=${Date.now()}`

      document.body.appendChild(img)

      // Видаляємо через 5 секунд
      setTimeout(() => {
        if (document.body.contains(img)) {
          document.body.removeChild(img)
        }
      }, 5000)
    }
  }, [consent, pixelId])

  return null
}
