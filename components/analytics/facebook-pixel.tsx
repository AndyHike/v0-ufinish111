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
  const scriptLoadedRef = useRef(false)
  const pixelInitializedRef = useRef(false)
  const lastConsentRef = useRef(consent)

  // Функція для повного очищення Facebook Pixel (аналогічно GA)
  const cleanupFacebookPixel = () => {
    if (typeof window === "undefined") return

    // Видаляємо всі Facebook скрипти
    const scripts = document.querySelectorAll(`script[src*="fbevents.js"]`)
    scripts.forEach((script) => script.remove())

    // Очищуємо глобальні змінні
    delete window.fbq
    delete window._fbq

    // Очищуємо cookies (аналогічно GA)
    const fbCookies = ["_fbp", "_fbc", "fr"]
    const domains = ["", window.location.hostname, "." + window.location.hostname, ".devicehelp.cz"]
    const paths = ["/", "/admin", "/auth", ""]

    fbCookies.forEach((cookieName) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
          if (domain) {
            document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}; domain=${domain}`
            document.cookie = `${cookieName}=; max-age=0; path=${path}; domain=${domain}`
          }
          document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}`
          document.cookie = `${cookieName}=; max-age=0; path=${path}`
        })
      })
    })

    // Скидаємо стан
    scriptLoadedRef.current = false
    pixelInitializedRef.current = false
  }

  // Функція для ініціалізації Facebook Pixel з нуля (аналогічно GA)
  const initializeFacebookPixelFromScratch = () => {
    if (typeof window === "undefined" || !pixelId || !consent) return

    // Спочатку очищуємо все
    cleanupFacebookPixel()

    // Ініціалізуємо Facebook Pixel (використовуючи офіційний код)
    !((f: any, b: any, e: any, v: any, n: any, t: any, s: any) => {
      if (f.fbq) return
      n = f.fbq = (...args: any[]) => {
        n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args)
      }
      if (!f._fbq) f._fbq = n
      n.push = n
      n.loaded = !0
      n.version = "2.0"
      n.queue = []
      t = b.createElement(e)
      t.async = !0
      t.src = `${v}?t=${Date.now()}` // Додаємо timestamp для свіжого завантаження

      t.onload = () => {
        scriptLoadedRef.current = true
        console.log("Facebook Pixel script loaded successfully")

        // Ініціалізуємо піксель після завантаження скрипта
        setTimeout(() => {
          if (window.fbq && !pixelInitializedRef.current) {
            // Ініціалізація пікселя
            window.fbq("init", pixelId)

            // Відправляємо PageView
            window.fbq("track", "PageView")

            // Додаткові події для створення cookies
            window.fbq("track", "ViewContent", {
              content_name: document.title,
              content_category: "page_view",
            })

            pixelInitializedRef.current = true
            console.log(`Facebook Pixel initialized successfully with ID: ${pixelId}`)

            // Перевіряємо створення cookies
            setTimeout(() => {
              const fbpCookie = document.cookie.includes("_fbp=")
              const fbcCookie = document.cookie.includes("_fbc=")
              console.log("Facebook cookies created:", { _fbp: fbpCookie, _fbc: fbcCookie })

              if (!fbpCookie) {
                // Додаткові спроби створення cookies
                window.fbq("track", "Lead")
                window.fbq("trackCustom", "CookieForce")
              }
            }, 1000)
          }
        }, 300)
      }

      t.onerror = () => {
        console.warn("Facebook Pixel script failed to load")
      }

      s = b.getElementsByTagName(e)[0]
      s.parentNode.insertBefore(t, s)
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")
  }

  // Основний useEffect для обробки змін consent (аналогічно GA)
  useEffect(() => {
    const consentChanged = lastConsentRef.current !== consent
    lastConsentRef.current = consent

    if (!consent) {
      // Якщо згода відкликана
      if (consentChanged) {
        console.log("Facebook Pixel consent revoked - cleaning up")
        cleanupFacebookPixel()
      }
      return
    }

    // Якщо згода надана
    if (consent && consentChanged) {
      // Ініціалізуємо Facebook Pixel з нуля при зміні згоди
      console.log("Facebook Pixel consent granted - initializing from scratch")
      setTimeout(() => {
        initializeFacebookPixelFromScratch()
      }, 100)
    } else if (consent && !pixelInitializedRef.current) {
      // Ініціалізуємо Facebook Pixel якщо ще не ініціалізований
      console.log("Facebook Pixel initial load with consent")
      initializeFacebookPixelFromScratch()
    }
  }, [consent, pixelId])

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      if (!consent) {
        cleanupFacebookPixel()
      }
    }
  }, [consent])

  if (!consent || !pixelId) {
    return null
  }

  return (
    <>
      {/* Noscript fallback */}
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

// Експортуємо функції для ручного відстеження (аналогічно GA)
export const trackFacebookEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, parameters)
    return true
  } else {
    console.warn("Facebook Pixel not loaded - event not tracked:", eventName)
    return false
  }
}

export const trackFacebookCustomEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", eventName, parameters)
    return true
  } else {
    console.warn("Facebook Pixel not loaded - custom event not tracked:", eventName)
    return false
  }
}
