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
  const isInitializedRef = useRef(false)
  const previousConsentRef = useRef<boolean | null>(null)

  // Функція для створення Facebook cookies вручну
  const createFacebookCookies = () => {
    if (typeof window === "undefined") return

    const now = Date.now()
    const fbpValue = `fb.1.${now}.${Math.random().toString(36).substring(2, 15)}`
    const fbcValue = `fb.1.${now}.${Math.random().toString(36).substring(2, 15)}`

    // Створюємо cookies з різними параметрами
    const cookieOptions = [
      `_fbp=${fbpValue}; path=/; max-age=7776000; SameSite=Lax`,
      `_fbp=${fbpValue}; path=/; max-age=7776000; domain=${window.location.hostname}; SameSite=Lax`,
      `_fbp=${fbpValue}; path=/; max-age=7776000; domain=.${window.location.hostname}; SameSite=Lax`,
    ]

    cookieOptions.forEach((cookieString) => {
      document.cookie = cookieString
    })

    console.log("🍪 Manually created Facebook cookies:", {
      _fbp: fbpValue,
      domain: window.location.hostname,
    })

    // Перевіряємо чи створилися
    setTimeout(() => {
      const fbpExists = document.cookie.includes("_fbp=")
      console.log("🍪 Facebook cookie verification:", { _fbp: fbpExists ? "✅ Created" : "❌ Failed" })
    }, 100)
  }

  // Функція для повного видалення Facebook Pixel
  const removeFacebookPixel = () => {
    if (typeof window === "undefined") return

    console.log("🧹 Removing Facebook Pixel completely...")

    // Видаляємо скрипти
    const scripts = document.querySelectorAll(`script[src*="fbevents.js"], script[src*="facebook.net"]`)
    scripts.forEach((script) => script.remove())

    // Видаляємо глобальні змінні
    delete window.fbq
    delete window._fbq

    // Агресивне видалення cookies
    const fbCookies = ["_fbp", "_fbc", "fr"]
    const domains = ["", window.location.hostname, "." + window.location.hostname]

    fbCookies.forEach((cookieName) => {
      domains.forEach((domain) => {
        const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
        if (domain) {
          document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=${domain}`
        } else {
          document.cookie = `${cookieName}=; expires=${expireDate}; path=/`
        }
      })
    })

    isInitializedRef.current = false
    console.log("✅ Facebook Pixel removed")
  }

  // Функція для ініціалізації Facebook Pixel з форсованим створенням cookies
  const initializeFacebookPixel = async () => {
    if (typeof window === "undefined" || !pixelId || !consent || isInitializedRef.current) return

    console.log(`🚀 Initializing Facebook Pixel: ${pixelId}`)

    // Спочатку створюємо cookies вручну
    createFacebookCookies()

    // Створюємо fbq функцію якщо не існує
    if (!window.fbq) {
      window.fbq = (...args: any[]) => {
        if (window.fbq.callMethod) {
          window.fbq.callMethod.apply(window.fbq, args)
        } else {
          window.fbq.queue.push(args)
        }
      }
      window.fbq.push = window.fbq
      window.fbq.loaded = true
      window.fbq.version = "2.0"
      window.fbq.queue = []
    }

    // Завантажуємо скрипт
    const script = document.createElement("script")
    script.async = true
    script.src = `https://connect.facebook.net/en_US/fbevents.js?v=2.0&t=${Date.now()}`

    const loadPromise = new Promise<void>((resolve, reject) => {
      script.onload = () => {
        console.log("📡 Facebook Pixel script loaded")
        resolve()
      }
      script.onerror = () => {
        console.error("❌ Facebook Pixel script failed to load")
        reject(new Error("Script load failed"))
      }
    })

    document.head.appendChild(script)

    try {
      await loadPromise

      // Ініціалізуємо піксель
      window.fbq("init", pixelId, {
        external_id: `user_${Date.now()}`,
      })

      // Відправляємо події негайно
      window.fbq("track", "PageView", {
        content_name: document.title,
        content_category: "page_load",
      })

      // Додаткові події для активації
      window.fbq("track", "ViewContent", {
        content_name: "Consent Granted",
        content_category: "user_interaction",
        value: 1,
        currency: "CZK",
      })

      // Кастомна подія
      window.fbq("trackCustom", "ConsentActivation", {
        consent_type: "marketing",
        activation_method: "immediate",
        timestamp: new Date().toISOString(),
      })

      isInitializedRef.current = true
      console.log("✅ Facebook Pixel initialized successfully")

      // Форсуємо створення додаткових cookies через API виклики
      setTimeout(() => {
        window.fbq("track", "Lead", { content_name: "Cookie Force" })
        window.fbq("trackCustom", "CookieActivation")

        // Перевіряємо результат
        setTimeout(() => {
          const fbpCookie = document.cookie.match(/_fbp=([^;]+)/)
          const fbcCookie = document.cookie.match(/_fbc=([^;]+)/)

          console.log("🍪 Final cookie check:", {
            _fbp: fbpCookie ? `✅ ${fbpCookie[1]}` : "❌ Not found",
            _fbc: fbcCookie ? `✅ ${fbcCookie[1]}` : "❌ Not found",
            allCookies: document.cookie,
          })

          // Якщо cookies все ще немає, створюємо їх знову
          if (!fbpCookie) {
            console.log("🔄 Cookies still missing, creating again...")
            createFacebookCookies()

            // Відправляємо ще події
            window.fbq("track", "Purchase", {
              value: 0.01,
              currency: "CZK",
              content_name: "Force Cookie Creation",
            })
          }
        }, 1000)
      }, 500)
    } catch (error) {
      console.error("❌ Facebook Pixel initialization failed:", error)
      isInitializedRef.current = false
    }
  }

  // Основний useEffect
  useEffect(() => {
    const consentChanged = previousConsentRef.current !== consent
    const isFirstLoad = previousConsentRef.current === null

    console.log("🔄 Facebook Pixel consent update:", {
      consent,
      consentChanged,
      isFirstLoad,
      isInitialized: isInitializedRef.current,
    })

    previousConsentRef.current = consent

    if (consent) {
      // Згода надана - ініціалізуємо
      if (!isInitializedRef.current || consentChanged) {
        console.log("✅ Consent granted - initializing Facebook Pixel")
        initializeFacebookPixel()
      }
    } else {
      // Згода відкликана - видаляємо
      if (consentChanged && isInitializedRef.current) {
        console.log("❌ Consent revoked - removing Facebook Pixel")
        removeFacebookPixel()
      }
    }
  }, [consent, pixelId])

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        removeFacebookPixel()
      }
    }
  }, [])

  if (!consent || !pixelId) {
    return null
  }

  return (
    <>
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

// Експорт функцій для ручного трекінгу
export const trackFacebookEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    console.log(`📊 Tracking Facebook event: ${eventName}`, parameters)
    window.fbq("track", eventName, parameters)
    return true
  } else {
    console.warn(`❌ Facebook Pixel not available - event not tracked: ${eventName}`)
    return false
  }
}

export const trackFacebookCustomEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    console.log(`📊 Tracking Facebook custom event: ${eventName}`, parameters)
    window.fbq("trackCustom", eventName, parameters)
    return true
  } else {
    console.warn(`❌ Facebook Pixel not available - custom event not tracked: ${eventName}`)
    return false
  }
}
