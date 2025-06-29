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
  const initRef = useRef(false)
  const consentRef = useRef(consent)

  useEffect(() => {
    // Якщо немає згоди - очищуємо все
    if (!consent) {
      if (consentRef.current === true) {
        // Згода була відкликана
        console.log("Facebook Pixel: Consent revoked, cleaning up")

        // Видаляємо скрипти
        document.querySelectorAll('script[src*="fbevents.js"]').forEach((s) => s.remove())

        // Очищуємо глобальні змінні
        if (window.fbq) delete window.fbq
        if (window._fbq) delete window._fbq

        // Очищуємо cookies
        const cookies = ["_fbp", "_fbc", "fr"]
        cookies.forEach((name) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
        })

        initRef.current = false
      }
      consentRef.current = consent
      return
    }

    // Якщо згода надана і ще не ініціалізували
    if (consent && !initRef.current) {
      console.log("Facebook Pixel: Initializing with consent")

      // Створюємо fbq функцію
      window.fbq =
        window.fbq ||
        (() => {
          ;(window.fbq.q = window.fbq.q || []).push(arguments)
        })
      window.fbq.l = +new Date()

      // Створюємо і додаємо скрипт
      const script = document.createElement("script")
      script.async = true
      script.src = "https://connect.facebook.net/en_US/fbevents.js"

      script.onload = () => {
        console.log("Facebook Pixel: Script loaded")

        // Ініціалізуємо піксель
        window.fbq("init", pixelId)
        console.log(`Facebook Pixel: Initialized with ID ${pixelId}`)

        // Відправляємо PageView
        window.fbq("track", "PageView")
        console.log("Facebook Pixel: PageView tracked")

        // Перевіряємо cookies через секунду
        setTimeout(() => {
          const hasFbp = document.cookie.includes("_fbp=")
          const hasFbc = document.cookie.includes("_fbc=")
          console.log(`Facebook Pixel: Cookies check - _fbp: ${hasFbp}, _fbc: ${hasFbc}`)

          // Якщо немає cookies, відправляємо додаткові події
          if (!hasFbp) {
            window.fbq("track", "ViewContent", { content_name: "Cookie Test" })
            window.fbq("trackCustom", "CookieTest")
            console.log("Facebook Pixel: Additional events sent for cookie creation")
          }
        }, 1000)
      }

      script.onerror = () => {
        console.error("Facebook Pixel: Failed to load script")
      }

      document.head.appendChild(script)
      initRef.current = true
    }

    consentRef.current = consent
  }, [consent, pixelId])

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      if (!consent && initRef.current) {
        console.log("Facebook Pixel: Component unmounting, cleaning up")
        document.querySelectorAll('script[src*="fbevents.js"]').forEach((s) => s.remove())
        if (window.fbq) delete window.fbq
        if (window._fbq) delete window._fbq
      }
    }
  }, [consent])

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

export const trackFacebookEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, parameters)
    console.log(`Facebook Pixel: Event tracked - ${eventName}`, parameters)
    return true
  }
  console.warn(`Facebook Pixel: Cannot track event ${eventName} - fbq not available`)
  return false
}

export const trackFacebookCustomEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", eventName, parameters)
    console.log(`Facebook Pixel: Custom event tracked - ${eventName}`, parameters)
    return true
  }
  console.warn(`Facebook Pixel: Cannot track custom event ${eventName} - fbq not available`)
  return false
}
