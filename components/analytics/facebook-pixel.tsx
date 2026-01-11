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
    testFacebookPixel: () => void
    trackServiceClick: (serviceName: string, modelName: string, price: number) => void
    trackContactSubmission: (formData: any) => void
    trackContactClick: (method: string, location: string) => void
    FB_PIXEL_INITIALIZED: boolean
  }
}

export function FacebookPixel({ pixelId, consent }: FacebookPixelProps) {
  const isInitialized = useRef(false)

  const clearFacebookResources = () => {
    const facebookCookies = ["_fbp", "_fbc", "fr"]
    facebookCookies.forEach((cookieName) => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
    })

    document.querySelectorAll('script[src*="fbevents.js"]').forEach((script) => {
      script.remove()
    })

    delete window.fbq
    delete window._fbq
    window.FB_PIXEL_INITIALIZED = false
    isInitialized.current = false
  }

  const initializeFacebookPixel = () => {
    if (!pixelId || isInitialized.current) {
      return
    }

    try {
      !((f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) => {
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
        s = b.getElementsByTagName(e)[0]
        s.parentNode.insertBefore(t, s)
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")

      window.fbq("init", pixelId)
      window.fbq("track", "PageView")

      window.FB_PIXEL_INITIALIZED = true
      isInitialized.current = true

      window.dispatchEvent(
        new CustomEvent("facebookPixelInitialized", {
          detail: { pixelId },
        }),
      )
    } catch (error) {
      console.error("Facebook Pixel initialization failed:", error)
    }
  }

  useEffect(() => {
    if (consent && !isInitialized.current) {
      setTimeout(() => {
        initializeFacebookPixel()
      }, 100)
    } else if (!consent && isInitialized.current) {
      clearFacebookResources()
    }
  }, [consent, pixelId])

  useEffect(() => {
    window.trackServiceClick = (serviceName: string, modelName: string, price: number) => {
      if (window.fbq && consent && isInitialized.current) {
        try {
          window.fbq("track", "ViewContent", {
            content_name: `${serviceName} - ${modelName}`,
            content_type: "service",
            value: price,
            currency: "CZK",
          })
        } catch (error) {
          console.error("Service click tracking failed:", error)
        }
      }
    }

    window.trackContactSubmission = (formData: any) => {
      if (window.fbq && consent && isInitialized.current) {
        try {
          window.fbq("track", "Lead", {
            content_name: "Contact Form Submission",
            value: 100,
            currency: "CZK",
          })
        } catch (error) {
          console.error("Contact submission tracking failed:", error)
        }
      }
    }

    window.trackContactClick = (method: string, location: string) => {
      if (window.fbq && consent && isInitialized.current) {
        try {
          window.fbq("trackCustom", "ContactClick", {
            contact_method: method,
            page_location: location,
          })
        } catch (error) {
          console.error("Contact click tracking failed:", error)
        }
      }
    }

    window.testFacebookPixel = () => {
      if (window.fbq && consent && isInitialized.current) {
        try {
          window.fbq("trackCustom", "ManualTest", {
            content_name: "Manual Pixel Test",
            test_timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error("Test event failed:", error)
        }
      }
    }
  }, [consent, pixelId])

  return null
}
