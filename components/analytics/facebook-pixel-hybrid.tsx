"use client"

import { useEffect, useRef, useState } from "react"

interface FacebookPixelHybridProps {
  pixelId: string
  consent: boolean
}

declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: any
  }
}

export function FacebookPixelHybrid({ pixelId, consent }: FacebookPixelHybridProps) {
  const lastConsentRef = useRef(consent)
  const [trackingMethod, setTrackingMethod] = useState<"client" | "server" | "manual">("client")
  const initAttemptRef = useRef(0)

  // Функція для створення cookies вручну
  const createManualCookies = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)

    const fbp = `fb.1.${timestamp}.${random}`
    const fbc = `fb.1.${timestamp}.${random}2`

    // Створюємо cookies з різними варіантами
    const cookieOptions = [
      `_fbp=${fbp}; path=/; max-age=7776000; SameSite=Lax`,
      `_fbc=${fbc}; path=/; max-age=7776000; SameSite=Lax`,
      `_fbp=${fbp}; path=/; max-age=7776000; SameSite=None; Secure`,
      `_fbc=${fbc}; path=/; max-age=7776000; SameSite=None; Secure`,
    ]

    cookieOptions.forEach((cookie) => {
      document.cookie = cookie
    })

    console.log("🍪 Manual Facebook cookies created:", { fbp, fbc })
    return { fbp, fbc }
  }

  // Server-side tracking fallback
  const trackServerSide = async (eventName: string, customData: any = {}) => {
    try {
      const fbpCookie = document.cookie.match(/_fbp=([^;]+)/)
      const fbcCookie = document.cookie.match(/_fbc=([^;]+)/)

      const response = await fetch("/api/facebook-conversions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: eventName,
          data: {
            url: window.location.href,
            fbp: fbpCookie?.[1],
            fbc: fbcCookie?.[1],
            customData,
          },
          userAgent: navigator.userAgent,
          ip: undefined, // Server буде отримувати IP автоматично
        }),
      })

      const result = await response.json()
      console.log(`📊 Server-side tracking: ${eventName}`, result)
      return result.success
    } catch (error) {
      console.error("Server-side tracking failed:", error)
      return false
    }
  }

  // Прямий HTTP запит до Facebook
  const trackDirectHTTP = async (eventName: string, customData: any = {}) => {
    try {
      const fbpCookie = document.cookie.match(/_fbp=([^;]+)/)
      const fbcCookie = document.cookie.match(/_fbc=([^;]+)/)

      const params = new URLSearchParams({
        id: pixelId,
        ev: eventName,
        dl: window.location.href,
        rl: document.referrer,
        ts: Date.now().toString(),
        ...(fbpCookie && { fbp: fbpCookie[1] }),
        ...(fbcCookie && { fbc: fbcCookie[1] }),
        ...customData,
      })

      // Використовуємо img pixel для обходу CORS
      const img = new Image()
      img.src = `https://www.facebook.com/tr?${params.toString()}`

      console.log(`📊 Direct HTTP tracking: ${eventName}`)
      return true
    } catch (error) {
      console.error("Direct HTTP tracking failed:", error)
      return false
    }
  }

  // Гібридна функція трекінгу
  const hybridTrack = async (eventName: string, customData: any = {}) => {
    let success = false

    // Спроба 1: Client-side Facebook Pixel
    if (window.fbq && trackingMethod === "client") {
      try {
        window.fbq("track", eventName, customData)
        console.log(`✅ Client-side tracking: ${eventName}`)
        success = true
      } catch (error) {
        console.warn("Client-side tracking failed:", error)
      }
    }

    // Спроба 2: Server-side Conversions API
    if (!success || trackingMethod === "server") {
      success = await trackServerSide(eventName, customData)
      if (success) {
        setTrackingMethod("server")
      }
    }

    // Спроба 3: Direct HTTP запит
    if (!success || trackingMethod === "manual") {
      success = await trackDirectHTTP(eventName, customData)
      if (success) {
        setTrackingMethod("manual")
      }
    }

    return success
  }

  // Агресивна ініціалізація з множинними спробами
  const aggressiveInit = async () => {
    if (!consent || !pixelId) return

    initAttemptRef.current++
    const attempt = initAttemptRef.current

    console.log(`🚀 Facebook Pixel aggressive init attempt ${attempt}`)

    // Створюємо cookies вручну одразу
    const { fbp, fbc } = createManualCookies()

    // Спроба 1: Стандартна ініціалізація
    try {
      // Очищуємо попередні скрипти
      document.querySelectorAll('script[src*="fbevents.js"]').forEach((s) => s.remove())
      delete window.fbq
      delete window._fbq

      // Завантажуємо скрипт з timestamp
      const script = document.createElement("script")
      script.async = true
      script.src = `https://connect.facebook.net/en_US/fbevents.js?v=2.0&t=${Date.now()}`

      script.onload = () => {
        console.log("📡 Facebook script loaded")

        // Ініціалізуємо з затримкою
        setTimeout(() => {
          if (window.fbq) {
            window.fbq("init", pixelId)
            hybridTrack("PageView")
            setTrackingMethod("client")
            console.log("✅ Client-side Facebook Pixel initialized")
          }
        }, 100)
      }

      script.onerror = () => {
        console.warn("❌ Facebook script failed to load, switching to server-side")
        setTrackingMethod("server")
        hybridTrack("PageView")
      }

      document.head.appendChild(script)

      // Паралельно ініціалізуємо fbq функцію
      if (!window.fbq) {
        window.fbq = (...args: any[]) => {
          ;(window.fbq as any).callMethod
            ? (window.fbq as any).callMethod.apply(window.fbq, args)
            : ((window.fbq as any).queue = (window.fbq as any).queue || []).push(args)
        }
        ;(window.fbq as any).push = window.fbq
        ;(window.fbq as any).loaded = true
        ;(window.fbq as any).version = "2.0"
        ;(window.fbq as any).queue = []
      }
    } catch (error) {
      console.error("Standard init failed:", error)
      setTrackingMethod("server")
    }

    // Спроба 2: Iframe fallback
    setTimeout(() => {
      const iframe = document.createElement("iframe")
      iframe.style.display = "none"
      iframe.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&fbp=${fbp}&fbc=${fbc}&noscript=1`
      document.body.appendChild(iframe)

      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 2000)
    }, 500)

    // Спроба 3: Server-side backup
    setTimeout(() => {
      hybridTrack("PageView", {
        init_attempt: attempt,
        method: "aggressive_init",
      })
    }, 1000)

    // Перевірка успішності через 3 секунди
    setTimeout(() => {
      const fbpExists = document.cookie.includes("_fbp=")
      const fbcExists = document.cookie.includes("_fbc=")

      console.log(`🔍 Init attempt ${attempt} result:`, {
        fbp_cookie: fbpExists ? "✅" : "❌",
        fbc_cookie: fbcExists ? "✅" : "❌",
        fbq_loaded: !!window.fbq ? "✅" : "❌",
        tracking_method: trackingMethod,
      })

      if (!fbpExists && attempt < 3) {
        console.log("🔄 Retrying initialization...")
        aggressiveInit()
      }
    }, 3000)
  }

  // Повне очищення
  const fullCleanup = () => {
    console.log("🧹 Full Facebook Pixel cleanup")

    // Видаляємо скрипти
    document.querySelectorAll('script[src*="fbevents.js"], script[src*="facebook.net"]').forEach((s) => s.remove())

    // Очищуємо глобальні змінні
    delete window.fbq
    delete window._fbq

    // Очищуємо cookies агресивно
    const domains = ["", window.location.hostname, "." + window.location.hostname]
    const paths = ["/", ""]
    const cookies = ["_fbp", "_fbc", "fr"]

    cookies.forEach((cookie) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const variants = [
            `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`,
            `${cookie}=; max-age=0; path=${path}`,
            `${cookie}=deleted; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`,
          ]

          if (domain) {
            variants.forEach((v) => {
              document.cookie = `${v}; domain=${domain}`
              document.cookie = `${v}; domain=${domain}; SameSite=Lax`
              document.cookie = `${v}; domain=${domain}; SameSite=None; Secure`
            })
          }

          variants.forEach((v) => {
            document.cookie = v
            document.cookie = `${v}; SameSite=Lax`
            document.cookie = `${v}; SameSite=None; Secure`
          })
        })
      })
    })

    setTrackingMethod("client")
    initAttemptRef.current = 0
  }

  // Основний useEffect
  useEffect(() => {
    const consentChanged = lastConsentRef.current !== consent
    lastConsentRef.current = consent

    if (!consent) {
      if (consentChanged) {
        fullCleanup()
      }
      return
    }

    if (consent && consentChanged) {
      console.log("✅ Facebook Pixel consent granted - starting aggressive initialization")
      setTimeout(() => {
        aggressiveInit()
      }, 100)
    } else if (consent && !window.fbq) {
      console.log("🆕 Facebook Pixel initial load")
      aggressiveInit()
    }
  }, [consent, pixelId])

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      if (!consent) {
        fullCleanup()
      }
    }
  }, [consent])

  // Експортуємо функцію трекінгу
  useEffect(() => {
    if (consent) {
      ;(window as any).trackFacebookEvent = hybridTrack
    } else {
      delete (window as any).trackFacebookEvent
    }
  }, [consent, trackingMethod])

  if (!consent || !pixelId) {
    return null
  }

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  )
}

// Експорт функцій для використання
export const trackFacebookEventHybrid = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== "undefined" && (window as any).trackFacebookEvent) {
    return (window as any).trackFacebookEvent(eventName, parameters)
  }
  console.warn("Facebook tracking not available")
  return false
}
