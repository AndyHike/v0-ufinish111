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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousConsentRef = useRef<boolean>(false)

  // Initialize Facebook Pixel when consent is granted
  useEffect(() => {
    const consentChanged = previousConsentRef.current !== consent
    previousConsentRef.current = consent

    if (consent && pixelId && (!initializationRef.current || consentChanged)) {
      // Reset states if consent just changed from false to true
      if (consentChanged && consent) {
        initializationRef.current = false
        setIsInitialized(false)
        setIsLoaded(false)
        setIsBlocked(false)
      }

      if (!initializationRef.current) {
        initializationRef.current = true
        console.log(`Facebook Pixel initializing with ID: ${pixelId}`)

        if (typeof window !== "undefined") {
          // Clear any existing Facebook Pixel setup completely
          delete window.fbq
          delete window._fbq

          // Remove existing Facebook scripts
          const existingScripts = document.querySelectorAll(`script[src*="fbevents.js"]`)
          existingScripts.forEach((script) => script.remove())

          try {
            // Set timeout for fallback check
            timeoutRef.current = setTimeout(() => {
              if (!isLoaded && !isBlocked) {
                console.warn("Facebook Pixel script didn't load within 5 seconds - may be blocked")
                setIsBlocked(true)
              }
            }, 5000)

            // Use the exact Facebook Pixel code provided with immediate activation
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

                // Clear timeout since we got an error
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current)
                  timeoutRef.current = null
                }

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

                // Clear timeout since script loaded successfully
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current)
                  timeoutRef.current = null
                }

                // Initialize pixel immediately after script loads
                setTimeout(() => {
                  try {
                    if (window.fbq && !isInitialized) {
                      // Initialize only once
                      window.fbq("init", pixelId)
                      window.fbq("track", "PageView")

                      // Add additional tracking to ensure cookie creation
                      window.fbq("track", "ViewContent", {
                        content_name: "Consent Granted",
                        content_category: "User Interaction",
                      })

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

            // Immediate initialization attempt (for very fast loading)
            setTimeout(() => {
              try {
                if (window.fbq && !isInitialized) {
                  window.fbq("init", pixelId)
                  window.fbq("track", "PageView")
                  window.fbq("track", "ViewContent", {
                    content_name: "Immediate Consent",
                    content_category: "User Interaction",
                  })
                  setIsInitialized(true)
                  console.log(`Facebook Pixel immediate initialization completed for ID: ${pixelId}`)
                }
              } catch (error) {
                // This is expected if script hasn't loaded yet
                console.log("Facebook Pixel immediate initialization pending script load")
              }
            }, 50)
          } catch (error) {
            console.warn("Facebook Pixel setup error:", error)
            setIsBlocked(true)

            // Clear timeout on error
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
              timeoutRef.current = null
            }
          }
        }
      }
    }
  }, [pixelId, consent, isLoaded, isInitialized])

  // Clear Facebook Pixel when consent is revoked
  useEffect(() => {
    if (!consent && typeof window !== "undefined") {
      console.log("Clearing Facebook Pixel data due to consent revocation")

      // Clear timeout if it exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

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
