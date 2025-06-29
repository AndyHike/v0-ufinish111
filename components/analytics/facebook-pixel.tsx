"use client"

import { useEffect } from "react"

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
  // Функція для агресивного очищення Facebook cookies
  const forceClearFacebookCookies = () => {
    if (typeof document === "undefined") return

    const facebookCookies = ["_fbp", "_fbc", "fr", "_gcl_aw", "_gcl_dc", "_gcl_gb", "_gcl_gf", "_gcl_ha"]
    const domains = ["", window.location.hostname, "." + window.location.hostname, ".devicehelp.cz", "devicehelp.cz"]
    const paths = ["/", "/admin", "/auth", ""]

    // Множинні спроби очищення з різними параметрами
    facebookCookies.forEach((cookieName) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
          const maxAgeZero = "max-age=0"

          // Різні комбінації очищення
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
  }

  // Функція для форсованої активації Facebook Pixel
  const forceActivateFacebookPixel = () => {
    if (typeof window === "undefined" || !pixelId) return

    console.log(`Force activating Facebook Pixel with ID: ${pixelId}`)

    // Очищуємо попередні Facebook ресурси
    const existingScripts = document.querySelectorAll(`script[src*="fbevents.js"]`)
    existingScripts.forEach((script) => script.remove())

    // Очищуємо глобальні змінні
    delete window.fbq
    delete window._fbq

    // Створюємо Facebook Pixel функцію (оригінальний код від Facebook)
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
    })(window, document, "script", `https://connect.facebook.net/en_US/fbevents.js?t=${Date.now()}`)

    // Ініціалізуємо pixel з затримкою для завантаження скрипта
    setTimeout(() => {
      if (window.fbq) {
        // Ініціалізація pixel
        window.fbq("init", pixelId)

        // Відправляємо PageView
        window.fbq("track", "PageView")

        // Додаткові події для активації cookies
        window.fbq("track", "ViewContent", {
          content_type: "website",
          source: "cookie_consent_activation",
        })

        console.log(`Facebook Pixel ${pixelId} activated successfully`)
      }
    }, 500)

    // Додатково створюємо noscript img для активації
    const noscriptImg = document.createElement("img")
    noscriptImg.height = 1
    noscriptImg.width = 1
    noscriptImg.style.display = "none"
    noscriptImg.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1&t=${Date.now()}`
    document.body.appendChild(noscriptImg)

    // Видаляємо img через деякий час
    setTimeout(() => {
      if (document.body.contains(noscriptImg)) {
        document.body.removeChild(noscriptImg)
      }
    }, 2000)
  }

  useEffect(() => {
    if (!pixelId) return

    if (consent) {
      console.log(`Facebook Pixel consent granted for ID: ${pixelId}`)
      // Активуємо Facebook Pixel з затримкою
      setTimeout(() => {
        forceActivateFacebookPixel()
      }, 200)
    } else {
      console.log("Facebook Pixel consent denied - clearing cookies")
      // Очищуємо cookies при відкликанні згоди
      forceClearFacebookCookies()

      // Очищуємо глобальні змінні
      if (typeof window !== "undefined") {
        delete window.fbq
        delete window._fbq
      }
    }
  }, [pixelId, consent])

  // Не рендеримо Script компонент, оскільки ми керуємо завантаженням вручну
  return null
}
