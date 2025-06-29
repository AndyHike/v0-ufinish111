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
  const [isBlocked, setIsBlocked] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const initializationRef = useRef(false)

  // Initialize Facebook Pixel only once when consent is granted
  useEffect(() => {
    if (consent && pixelId && !initializationRef.current) {
      initializationRef.current = true
      console.log(`Facebook Pixel initializing with ID: ${pixelId}`)

      if (typeof window !== "undefined") {
        // Check if fbq already exists to prevent duplicate initialization
        if (window.fbq && window._fbq) {
          console.log("Facebook Pixel already exists, just tracking PageView")
          try {
            window.fbq("track", "PageView")
            setIsLoaded(true)
            setIsInitialized(true)
            return
          } catch (error) {
            console.warn("Error tracking with existing fbq:", error)
          }
        }

        // Clear any existing Facebook Pixel setup
        delete window.fbq
        delete window._fbq

        // Remove existing Facebook scripts
        const existingScripts = document.querySelectorAll(`script[src*="fbevents.js"]`)
        existingScripts.forEach((script) => script.remove())

        try {
          // Use the exact Facebook Pixel code provided with error handling
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

            // Add error handling for script loading
            t.onerror = () => {
              console.warn("Facebook Pixel script blocked by ad blocker or failed to load")
              setIsBlocked(true)

              // Create a dummy fbq function to prevent errors
              if (!f.fbq) {
                f.fbq = (...args: any[]) => {
                  console.log("Facebook Pixel call (blocked):", args)
                }
              }
            }

            t.onload = () => {
              console.log("Facebook Pixel script loaded successfully")
              setIsLoaded(true)
              setIsBlocked(false)

              // Initialize pixel after script loads
              setTimeout(() => {
                try {
                  if (window.fbq && !isInitialized) {
                    window.fbq("init", pixelId)
                    window.fbq("track", "PageView")
                    setIsInitialized(true)
                    console.log(`Facebook Pixel initialized successfully with ID: ${pixelId}`)
                  }
                } catch (error) {
                  console.warn("Facebook Pixel initialization error:", error)
                  setIsBlocked(true)
                }
              }, 100)
            }

            s = b.getElementsByTagName(e)[0]
            s.parentNode.insertBefore(t, s)
          })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")

          // Fallback check after 5 seconds
          setTimeout(() => {
            if (!isLoaded && !isBlocked) {
              console.warn("Facebook Pixel script didn't load within 5 seconds - may be blocked")
              setIsBlocked(true)
            }
          }, 5000)
        } catch (error) {
          console.warn("Facebook Pixel setup error:", error)
          setIsBlocked(true)
        }
      }
    }
  }, [pixelId, consent, isLoaded, isInitialized])

  // Clear Facebook Pixel when consent is revoked
  useEffect(() => {
    if (!consent && typeof window !== "undefined") {
      console.log("Clearing Facebook Pixel data due to consent revocation")

      // Reset initialization flag
      initializationRef.current = false
      setIsInitialized(false)
      setIsLoaded(false)
      setIsBlocked(false)

      try {
        // Remove Facebook cookies
        const fbCookies = ["_fbp", "_fbc", "fr"]
        const domains = ["", window.location.hostname, "." + window.location.hostname]

        fbCookies.forEach((cookieName) => {
          domains.forEach((domain) => {
            const cookieString = domain
              ? `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`
              : `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            document.cookie = cookieString
          })
        })

        // Clear fbq function
        if (window.fbq) {
          delete window.fbq
          delete window._fbq
        }

        // Remove Facebook scripts
        const fbScripts = document.querySelectorAll(`script[src*="fbevents.js"]`)
        fbScripts.forEach((script) => script.remove())

        console.log("Facebook Pixel data cleared successfully")
      } catch (error) {
        console.warn("Could not clear Facebook cookies:", error)
      }
    }
  }, [consent])

  // Show status in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && consent && pixelId) {
      if (isBlocked) {
        console.warn(`🚫 Facebook Pixel (${pixelId}) is blocked by ad blocker or privacy extension`)
      } else if (isLoaded && isInitialized) {
        console.log(`✅ Facebook Pixel (${pixelId}) loaded and initialized successfully`)
      } else if (isLoaded) {
        console.log(`📡 Facebook Pixel (${pixelId}) script loaded, waiting for initialization`)
      }
    }
  }, [isBlocked, isLoaded, isInitialized, consent, pixelId])

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
      {process.env.NODE_ENV === "development" && consent && (
        <div
          style={{ display: "none" }}
          data-fb-pixel-status={isBlocked ? "blocked" : isLoaded && isInitialized ? "loaded" : "loading"}
          data-fb-pixel-id={pixelId}
        >
          Facebook Pixel Status:{" "}
          {isBlocked ? "Blocked" : isLoaded && isInitialized ? "Loaded & Initialized" : "Loading"}
        </div>
      )}
    </>
  )
}
