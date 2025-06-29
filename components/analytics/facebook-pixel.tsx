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

  // Функція для форсованого створення cookies від Facebook Pixel
  const forceFacebookCookieCreation = () => {
    if (typeof window === "undefined" || !window.fbq) return

    console.log("🍪 Forcing Facebook Pixel cookie creation...")

    // Відправляємо множинні події для форсування створення cookies
    const events = [
      () => window.fbq("track", "PageView"),
      () =>
        window.fbq("track", "ViewContent", {
          content_name: document.title,
          content_category: "page_view",
          value: 1,
          currency: "CZK",
        }),
      () =>
        window.fbq("track", "Search", {
          search_string: "consent_granted",
          content_category: "user_interaction",
        }),
      () =>
        window.fbq("track", "Lead", {
          content_name: "Cookie Creation Force",
          value: 0,
          currency: "CZK",
        }),
      () =>
        window.fbq("trackCustom", "ConsentGranted", {
          consent_type: "marketing",
          timestamp: new Date().toISOString(),
          page_url: window.location.href,
          user_agent: navigator.userAgent,
        }),
      () =>
        window.fbq("trackCustom", "CookieForceCreation", {
          attempt: 1,
          method: "immediate_activation",
        }),
    ]

    // Відправляємо події з інтервалами
    events.forEach((eventFn, index) => {
      setTimeout(() => {
        try {
          eventFn()
          console.log(`📊 Facebook event ${index + 1} sent`)
        } catch (error) {
          console.warn(`❌ Facebook event ${index + 1} failed:`, error)
        }
      }, index * 200) // 200ms між подіями
    })

    // Перевіряємо створення cookies через різні інтервали
    const checkCookies = (attempt: number) => {
      setTimeout(() => {
        const fbpCookie = document.cookie.match(/_fbp=([^;]+)/)
        const fbcCookie = document.cookie.match(/_fbc=([^;]+)/)

        console.log(`🍪 Cookie check attempt ${attempt}:`, {
          _fbp: fbpCookie ? `✅ ${fbpCookie[1]}` : "❌ Not found",
          _fbc: fbcCookie ? `✅ ${fbcCookie[1]}` : "❌ Not found",
        })

        // Якщо cookies все ще немає, відправляємо додаткові події
        if (!fbpCookie && attempt < 3) {
          console.log(`🔄 Cookies not found, sending additional events (attempt ${attempt})...`)

          // Додаткові спроби з різними подіями
          window.fbq("track", "AddToCart", {
            content_name: `Cookie Force Attempt ${attempt}`,
            value: attempt,
            currency: "CZK",
          })

          window.fbq("track", "InitiateCheckout", {
            content_name: "Force Cookie Creation",
            value: attempt,
            currency: "CZK",
          })

          window.fbq("trackCustom", "CookieRetry", {
            attempt: attempt,
            timestamp: new Date().toISOString(),
          })

          // Рекурсивна перевірка
          checkCookies(attempt + 1)
        }
      }, attempt * 1000) // 1s, 2s, 3s
    }

    // Починаємо перевірку
    checkCookies(1)
  }

  // Функція для повного очищення Facebook Pixel
  const cleanupFacebookPixel = () => {
    if (typeof window === "undefined") return

    console.log("🧹 Cleaning up Facebook Pixel...")

    // Видаляємо всі Facebook скрипти
    const scripts = document.querySelectorAll(`script[src*="fbevents.js"], script[src*="facebook.net"]`)
    scripts.forEach((script) => script.remove())

    // Очищуємо глобальні змінні
    delete window.fbq
    delete window._fbq

    // Очищуємо cookies
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

    console.log("✅ Facebook Pixel cleanup completed")
  }

  // Функція для ініціалізації Facebook Pixel з форсованим створенням cookies
  const initializeFacebookPixelFromScratch = () => {
    if (typeof window === "undefined" || !pixelId || !consent) return

    console.log(`🚀 Initializing Facebook Pixel with ID: ${pixelId}`)

    // Спочатку повністю очищуємо попередні ініціалізації
    cleanupFacebookPixel()

    // Невелика затримка для стабільності
    setTimeout(() => {
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
        t.src = `${v}?t=${Date.now()}` // Додаємо timestamp

        t.onload = () => {
          console.log("📡 Facebook Pixel script loaded successfully")

          // Ініціалізуємо піксель після завантаження скрипта
          setTimeout(() => {
            if (window.fbq) {
              console.log("🎯 Initializing Facebook Pixel...")

              // Ініціалізація пікселя з додатковими параметрами
              window.fbq("init", pixelId, {
                external_id: `user_${Date.now()}`,
                em: undefined, // email hash
                ph: undefined, // phone hash
                fn: undefined, // first name hash
                ln: undefined, // last name hash
                db: undefined, // date of birth hash
                ge: undefined, // gender hash
                ct: undefined, // city hash
                st: undefined, // state hash
                zp: undefined, // zip hash
                country: undefined, // country hash
              })

              console.log("✅ Facebook Pixel init completed")

              // Форсуємо створення cookies через множинні події
              forceFacebookCookieCreation()
            }
          }, 100) // Мінімальна затримка після завантаження скрипта
        }

        t.onerror = () => {
          console.warn("❌ Facebook Pixel script failed to load")
        }

        s = b.getElementsByTagName(e)[0]
        s.parentNode.insertBefore(t, s)
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")
    }, 50) // Мінімальна затримка для стабільності
  }

  // Основний useEffect для обробки змін consent
  useEffect(() => {
    const consentChanged = lastConsentRef.current !== consent
    lastConsentRef.current = consent

    console.log("🔄 Facebook Pixel consent change:", {
      consent,
      consentChanged,
      pixelId,
    })

    if (!consent) {
      // Якщо згода відкликана
      if (consentChanged) {
        console.log("❌ Facebook Pixel consent revoked - cleaning up")
        cleanupFacebookPixel()
      }
      return
    }

    // Якщо згода надана
    if (consent && consentChanged) {
      // Ініціалізуємо Facebook Pixel з нуля при зміні згоди
      console.log("✅ Facebook Pixel consent granted - initializing from scratch")
      initializeFacebookPixelFromScratch()
    } else if (consent && !window.fbq) {
      // Ініціалізуємо Facebook Pixel якщо ще не ініціалізований
      console.log("🆕 Facebook Pixel initial load with consent")
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

// Експортуємо функції для ручного відстеження
export const trackFacebookEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    console.log(`📊 Tracking Facebook event: ${eventName}`, parameters)
    window.fbq("track", eventName, parameters)
    return true
  } else {
    console.warn(`❌ Facebook Pixel not loaded - event not tracked: ${eventName}`)
    return false
  }
}

export const trackFacebookCustomEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    console.log(`📊 Tracking Facebook custom event: ${eventName}`, parameters)
    window.fbq("trackCustom", eventName, parameters)
    return true
  } else {
    console.warn(`❌ Facebook Pixel not loaded - custom event not tracked: ${eventName}`)
    return false
  }
}
