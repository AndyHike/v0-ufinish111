"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"

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

    // Множинні спроби очищення з різними параметрами
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

  // Функція для ініціалізації Facebook Pixel
  const initializeFacebookPixel = () => {
    if (!pixelId || isInitialized.current) return

    console.log(`Initializing Facebook Pixel with ID: ${pixelId}`)

    // Створюємо fbq функцію якщо її немає
    if (!window.fbq) {
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

    // Ініціалізуємо pixel
    window.fbq("init", pixelId)
    window.fbq("track", "PageView")

    // Додаткові події для тестування
    window.fbq("track", "ViewContent", {
      content_type: "website",
      source: "cookie_consent_activation",
    })

    isInitialized.current = true
    console.log(`Facebook Pixel ${pixelId} initialized successfully`)

    // Перевіряємо чи створились cookies
    setTimeout(() => {
      const cookies = document.cookie
      console.log("Current cookies after FB init:", cookies)
      if (cookies.includes("_fbp") || cookies.includes("_fbc")) {
        console.log("Facebook cookies created successfully")
      } else {
        console.warn("Facebook cookies not found, trying alternative method")
        // Альтернативний метод - створюємо подію клік
        window.fbq("trackCustom", "CookieConsentGranted", {
          consent_method: "banner",
          timestamp: new Date().toISOString(),
        })
      }
    }, 2000)
  }

  useEffect(() => {
    if (!pixelId) return

    if (consent) {
      console.log(`Facebook Pixel consent granted for ID: ${pixelId}`)

      // Якщо скрипт вже завантажений, ініціалізуємо відразу
      if (scriptLoaded.current) {
        initializeFacebookPixel()
      }
    } else {
      console.log("Facebook Pixel consent denied - clearing cookies")
      forceClearFacebookCookies()
    }
  }, [pixelId, consent])

  const handleScriptLoad = () => {
    console.log("Facebook Pixel script loaded")
    scriptLoaded.current = true

    // Ініціалізуємо pixel якщо є згода
    if (consent && pixelId) {
      setTimeout(() => {
        initializeFacebookPixel()
      }, 100)
    }
  }

  const handleScriptError = (error: any) => {
    console.error("Failed to load Facebook Pixel script:", error)
    scriptLoaded.current = false
  }

  // Рендеримо скрипт тільки якщо є згода та pixelId
  if (!consent || !pixelId) {
    return null
  }

  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        src="https://connect.facebook.net/en_US/fbevents.js"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
