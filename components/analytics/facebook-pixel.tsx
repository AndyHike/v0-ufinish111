"use client"

import { useEffect, useState, useRef } from "react"

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
  const [isInitialized, setIsInitialized] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const previousConsentRef = useRef<boolean | null>(null)
  const initializationInProgressRef = useRef(false)

  // Функція для повного очищення Facebook Pixel
  const clearFacebookPixel = () => {
    if (typeof window === "undefined") return

    console.log("Clearing Facebook Pixel data...")

    try {
      // Видалити cookies
      const fbCookies = ["_fbp", "_fbc", "fr"]
      const domains = ["", window.location.hostname, "." + window.location.hostname]
      const paths = ["/", ""]

      fbCookies.forEach((cookieName) => {
        domains.forEach((domain) => {
          paths.forEach((path) => {
            const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
            const cookieString = domain
              ? `${cookieName}=; expires=${expireDate}; path=${path}; domain=${domain};`
              : `${cookieName}=; expires=${expireDate}; path=${path};`
            document.cookie = cookieString
          })
        })
      })

      // Видалити глобальні змінні
      delete window.fbq
      delete window._fbq

      // Видалити скрипти
      const fbScripts = document.querySelectorAll(`script[src*="fbevents.js"]`)
      fbScripts.forEach((script) => script.remove())

      console.log("Facebook Pixel data cleared successfully")
    } catch (error) {
      console.warn("Error clearing Facebook Pixel:", error)
    }
  }

  // Функція для ініціалізації Facebook Pixel з форсованим створенням cookies
  const initializeFacebookPixel = () => {
    if (typeof window === "undefined" || !pixelId || initializationInProgressRef.current) return

    initializationInProgressRef.current = true
    console.log(`Initializing Facebook Pixel with ID: ${pixelId}`)

    try {
      // Спочатку повністю очищуємо попередні ініціалізації
      clearFacebookPixel()

      // Створюємо Facebook Pixel код
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
        t.src = v

        t.onerror = () => {
          console.warn("Facebook Pixel script blocked or failed to load")
          setIsBlocked(true)
          initializationInProgressRef.current = false
        }

        t.onload = () => {
          console.log("Facebook Pixel script loaded successfully")

          // Негайна ініціалізація після завантаження скрипта
          setTimeout(() => {
            try {
              if (window.fbq) {
                // Ініціалізуємо піксель
                window.fbq("init", pixelId)

                // Відправляємо PageView для створення cookies
                window.fbq("track", "PageView")

                // Додаткові події для гарантованого створення cookies
                window.fbq("track", "ViewContent", {
                  content_name: "Consent Granted",
                  content_category: "Marketing Consent",
                  value: 1,
                  currency: "CZK",
                })

                // Форсуємо створення cookies через додаткові виклики
                window.fbq("trackCustom", "ConsentGranted", {
                  consent_type: "marketing",
                  timestamp: new Date().toISOString(),
                })

                setIsInitialized(true)
                setIsBlocked(false)
                initializationInProgressRef.current = false

                console.log(`✅ Facebook Pixel initialized successfully with ID: ${pixelId}`)

                // Перевіряємо створення cookies через 1 секунду
                setTimeout(() => {
                  const fbpCookie = document.cookie.split(";").find((cookie) => cookie.trim().startsWith("_fbp="))
                  const fbcCookie = document.cookie.split(";").find((cookie) => cookie.trim().startsWith("_fbc="))

                  console.log("Facebook cookies status:", {
                    _fbp: fbpCookie ? "Created" : "Not found",
                    _fbc: fbcCookie ? "Created" : "Not found",
                  })

                  if (!fbpCookie) {
                    console.warn("Facebook _fbp cookie not created, forcing additional events...")
                    // Додаткові спроби створення cookies
                    window.fbq("track", "Lead")
                    window.fbq("trackCustom", "ForceCookieCreation")
                  }
                }, 1000)
              }
            } catch (error) {
              console.warn("Facebook Pixel initialization error:", error)
              setIsBlocked(true)
              initializationInProgressRef.current = false
            }
          }, 100)
        }

        s = b.getElementsByTagName(e)[0]
        s.parentNode.insertBefore(t, s)
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")
    } catch (error) {
      console.warn("Facebook Pixel setup error:", error)
      setIsBlocked(true)
      initializationInProgressRef.current = false
    }
  }

  // Основна логіка: перевірка налаштувань та реакція на зміни
  useEffect(() => {
    const consentChanged = previousConsentRef.current !== null && previousConsentRef.current !== consent
    const isFirstLoad = previousConsentRef.current === null

    previousConsentRef.current = consent

    if (consent && pixelId) {
      // Якщо згода є і це перша загрузка або зміна з false на true
      if (isFirstLoad || consentChanged) {
        console.log(
          isFirstLoad
            ? "Initial consent granted - loading Facebook Pixel"
            : "Consent changed to granted - forcing Facebook Pixel activation",
        )

        // Скидаємо стани
        setIsInitialized(false)
        setIsBlocked(false)
        initializationInProgressRef.current = false

        // Ініціалізуємо з невеликою затримкою для стабільності
        setTimeout(() => {
          initializeFacebookPixel()
        }, 100)
      }
    } else if (!consent && consentChanged) {
      // Згода відкликана - очищуємо все
      console.log("Consent revoked - clearing Facebook Pixel")
      clearFacebookPixel()
      setIsInitialized(false)
      setIsBlocked(false)
      initializationInProgressRef.current = false
    }
  }, [consent, pixelId])

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      if (!consent) {
        clearFacebookPixel()
      }
    }
  }, [consent])

  // Логування статусу в development режимі
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && consent && pixelId) {
      if (isBlocked) {
        console.warn(`🚫 Facebook Pixel (${pixelId}) is blocked`)
      } else if (isInitialized) {
        console.log(`✅ Facebook Pixel (${pixelId}) is active and tracking`)
      } else {
        console.log(`⏳ Facebook Pixel (${pixelId}) is loading...`)
      }
    }
  }, [isBlocked, isInitialized, consent, pixelId])

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

      {/* Development status indicator */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{ display: "none" }}
          data-fb-pixel-status={isBlocked ? "blocked" : isInitialized ? "active" : "loading"}
          data-fb-pixel-id={pixelId}
        >
          Facebook Pixel: {isBlocked ? "Blocked" : isInitialized ? "Active" : "Loading"}
        </div>
      )}
    </>
  )
}
