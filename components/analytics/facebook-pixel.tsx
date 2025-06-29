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
  const lastConsentRef = useRef<boolean | null>(null)

  // Функція для повного очищення Facebook Pixel
  const cleanupFacebookPixel = () => {
    if (typeof window === "undefined") return

    console.log("🧹 Cleaning up Facebook Pixel...")

    // Видаляємо всі Facebook скрипти
    const scripts = document.querySelectorAll(`script[src*="fbevents.js"]`)
    scripts.forEach((script) => script.remove())

    // Очищуємо глобальні змінні
    delete window.fbq
    delete window._fbq

    // Агресивне очищення cookies в реальному часі
    const fbCookies = ["_fbp", "_fbc", "fr"]
    const domains = ["", window.location.hostname, "." + window.location.hostname, ".devicehelp.cz"]
    const paths = ["/", "/admin", "/auth", ""]

    fbCookies.forEach((cookieName) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"

          // Множинні спроби видалення
          const deleteVariants = [
            `${cookieName}=; expires=${expireDate}; path=${path}`,
            `${cookieName}=; max-age=0; path=${path}`,
            `${cookieName}=deleted; expires=${expireDate}; path=${path}`,
            `${cookieName}=deleted; max-age=0; path=${path}`,
          ]

          if (domain) {
            deleteVariants.forEach((variant) => {
              document.cookie = `${variant}; domain=${domain}`
              document.cookie = `${variant}; domain=${domain}; SameSite=Lax`
              document.cookie = `${variant}; domain=${domain}; SameSite=None; Secure`
            })
          }

          deleteVariants.forEach((variant) => {
            document.cookie = variant
            document.cookie = `${variant}; SameSite=Lax`
            document.cookie = `${variant}; SameSite=None; Secure`
          })
        })
      })
    })

    // Скидаємо стан
    scriptLoadedRef.current = false
    pixelInitializedRef.current = false

    console.log("✅ Facebook Pixel cleanup completed")
  }

  // Функція для ініціалізації Facebook Pixel з нуля
  const initializeFacebookPixelFromScratch = () => {
    if (typeof window === "undefined" || !pixelId || !consent) return

    console.log(`🚀 Initializing Facebook Pixel with ID: ${pixelId}`)

    // Спочатку очищуємо все
    cleanupFacebookPixel()

    // Невелика затримка для стабільності
    setTimeout(() => {
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
          console.log("📡 Facebook Pixel script loaded successfully")

          // Негайна ініціалізація після завантаження скрипта
          if (window.fbq && !pixelInitializedRef.current) {
            // Ініціалізація пікселя
            window.fbq("init", pixelId)
            console.log(`🎯 Facebook Pixel init called for ID: ${pixelId}`)

            // Відправляємо PageView для створення cookies
            window.fbq("track", "PageView")
            console.log("📄 PageView event sent")

            // Додаткові події для гарантованого створення cookies
            window.fbq("track", "ViewContent", {
              content_name: document.title,
              content_category: "page_view",
              value: 1,
              currency: "CZK",
            })
            console.log("👁️ ViewContent event sent")

            // Кастомна подія для форсування cookies
            window.fbq("trackCustom", "ConsentGranted", {
              consent_type: "marketing",
              timestamp: new Date().toISOString(),
              page_url: window.location.href,
            })
            console.log("✅ ConsentGranted custom event sent")

            pixelInitializedRef.current = true
            console.log(`✅ Facebook Pixel initialized successfully with ID: ${pixelId}`)

            // Перевіряємо створення cookies в реальному часі
            const checkCookies = () => {
              const fbpCookie = document.cookie.includes("_fbp=")
              const fbcCookie = document.cookie.includes("_fbc=")
              console.log("🍪 Facebook cookies status:", {
                _fbp: fbpCookie ? "✅ Created" : "❌ Not found",
                _fbc: fbcCookie ? "✅ Created" : "❌ Not found",
              })

              if (!fbpCookie) {
                console.log("🔄 Forcing additional events for cookie creation...")
                // Додаткові спроби створення cookies
                window.fbq("track", "Lead", {
                  content_name: "Force Cookie Creation",
                  value: 0,
                  currency: "CZK",
                })
                window.fbq("trackCustom", "ForceCookieCreation", {
                  attempt: "real_time_activation",
                })

                // Повторна перевірка через 2 секунди
                setTimeout(() => {
                  const fbpCookieRetry = document.cookie.includes("_fbp=")
                  console.log("🍪 Facebook cookies retry check:", {
                    _fbp: fbpCookieRetry ? "✅ Created" : "❌ Still not found",
                  })
                }, 2000)
              }
            }

            // Перевіряємо cookies через різні інтервали
            setTimeout(checkCookies, 500)
            setTimeout(checkCookies, 1500)
            setTimeout(checkCookies, 3000)
          }
        }

        t.onerror = () => {
          console.warn("❌ Facebook Pixel script failed to load")
        }

        s = b.getElementsByTagName(e)[0]
        s.parentNode.insertBefore(t, s)
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")
    }, 50) // Мінімальна затримка для стабільності
  }

  // Основний useEffect для обробки змін consent в реальному часі
  useEffect(() => {
    const isFirstLoad = lastConsentRef.current === null
    const consentChanged = lastConsentRef.current !== null && lastConsentRef.current !== consent

    console.log("🔄 Facebook Pixel consent change detected:", {
      isFirstLoad,
      consentChanged,
      previousConsent: lastConsentRef.current,
      currentConsent: consent,
      pixelId,
    })

    lastConsentRef.current = consent

    if (!consent) {
      // Якщо згода відкликана - негайно очищуємо
      if (consentChanged) {
        console.log("❌ Facebook Pixel consent revoked - cleaning up immediately")
        cleanupFacebookPixel()
      }
      return
    }

    // Якщо згода надана
    if (consent && (isFirstLoad || consentChanged)) {
      if (isFirstLoad) {
        console.log("🆕 Facebook Pixel initial load with consent")
      } else {
        console.log("🔄 Facebook Pixel consent changed to granted - activating immediately")
      }

      // Скидаємо стани для свіжої ініціалізації
      scriptLoadedRef.current = false
      pixelInitializedRef.current = false

      // Ініціалізуємо Facebook Pixel негайно
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

  // Логування статусу в development режимі
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Facebook Pixel component state:", {
        consent,
        pixelId,
        scriptLoaded: scriptLoadedRef.current,
        pixelInitialized: pixelInitializedRef.current,
      })
    }
  }, [consent, pixelId])

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
