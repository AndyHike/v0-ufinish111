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
  const lastConsentRef = useRef(consent)

  // Функція для повного очищення Facebook Pixel (як у GA)
  const cleanupFacebookPixel = () => {
    if (typeof window === "undefined") return

    // Видаляємо всі Facebook скрипти
    const scripts = document.querySelectorAll(`script[src*="fbevents.js"], script[src*="facebook.net"]`)
    scripts.forEach((script) => script.remove())

    // Очищуємо глобальні змінні
    delete window.fbq
    delete window._fbq

    // Очищуємо cookies (точно як у GA)
    const fbCookies = ["_fbp", "_fbc", "fr"]
    const domains = ["", window.location.hostname, "." + window.location.hostname]
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
  }

  // Функція для ініціалізації Facebook Pixel з нуля (точно як у GA)
  const initializeFacebookPixelFromScratch = () => {
    if (typeof window === "undefined" || !pixelId || !consent) return

    // Спочатку повністю очищуємо попередні ініціалізації
    cleanupFacebookPixel()

    // Ініціалізуємо Facebook Pixel (використовуючи офіційний код Facebook)
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
      t.src = `${v}?t=${Date.now()}` // Додаємо timestamp як у GA

      t.onload = () => {
        // Ініціалізуємо піксель після завантаження скрипта (як у GA)
        setTimeout(() => {
          if (window.fbq) {
            // Ініціалізація пікселя
            window.fbq("init", pixelId)

            // Відправляємо PageView (як GA відправляє page_view)
            window.fbq("track", "PageView")

            // Додаткові події для активації (як у GA)
            window.fbq("track", "ViewContent", {
              content_name: document.title,
              content_category: "page_view",
            })

            console.log(`Facebook Pixel initialized successfully with ID: ${pixelId}`)
          }
        }, 300) // Та сама затримка як у GA
      }

      t.onerror = () => {
        console.warn("Facebook Pixel script failed to load")
      }

      s = b.getElementsByTagName(e)[0]
      s.parentNode.insertBefore(t, s)
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")
  }

  // Основний useEffect для обробки змін consent (точно як у GA)
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
      }, 100) // Та сама затримка як у GA
    } else if (consent && !window.fbq) {
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

// Експортуємо функції для ручного відстеження (як у GA)
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
