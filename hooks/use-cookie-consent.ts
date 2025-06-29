"use client"

import { useState, useEffect } from "react"
import type { CookieConsent, CookieConsentState } from "@/types/cookie-consent"

const COOKIE_CONSENT_KEY = "cookie-consent"
const CONSENT_EXPIRY_DAYS = 365

export function useCookieConsent() {
  const [state, setState] = useState<CookieConsentState>({
    consent: {
      necessary: true,
      analytics: false,
      marketing: false,
    },
    showBanner: false,
    hasInteracted: false,
    consentDate: null,
  })

  // Function for aggressive cookie clearing with forced update
  const forceClearCookies = (category: "analytics" | "marketing") => {
    if (typeof document === "undefined") return

    let cookiesToClear: string[] = []

    if (category === "analytics") {
      cookiesToClear = [
        "_ga",
        "_ga_WZ0WCHZ3XT",
        "_gid",
        "_gat",
        "_gat_gtag_G_WZ0WCHZ3XT",
        "__utma",
        "__utmb",
        "__utmc",
        "__utmt",
        "__utmz",
        "_gcl_au",
        "AMP_TOKEN",
        "_gac_gb_",
      ]
    } else if (category === "marketing") {
      cookiesToClear = ["_fbp", "_fbc", "fr", "_gcl_aw", "_gcl_dc", "_gcl_gb", "_gcl_gf", "_gcl_ha"]
    }

    const domains = ["", window.location.hostname, "." + window.location.hostname, ".devicehelp.cz", "devicehelp.cz"]
    const paths = ["/", "/admin", "/auth", ""]

    // Multiple clearing attempts with different parameters
    cookiesToClear.forEach((cookieName) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const expireDate = "Thu, 01 Jan 1970 00:00:00 UTC"
          const maxAgeZero = "max-age=0"

          // Different clearing combinations
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

    // Clear storage
    if (category === "analytics") {
      try {
        // localStorage
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("_ga") || key.startsWith("gtag") || key.includes("google")) {
            localStorage.removeItem(key)
          }
        })

        // sessionStorage
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("_ga") || key.startsWith("gtag") || key.includes("google")) {
            sessionStorage.removeItem(key)
          }
        })
      } catch (error) {
        console.warn("Could not clear storage:", error)
      }
    }

    // Update gtag consent
    if (typeof window !== "undefined" && window.gtag && category === "analytics") {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      })
    }

    // Force update through creating hidden iframe
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    iframe.src = "about:blank"
    document.body.appendChild(iframe)
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 100)
  }

  // Function to force activate Facebook Pixel with better error handling
  const forceActivateFacebookPixel = (pixelId: string) => {
    if (typeof window === "undefined" || !pixelId) return

    console.log(`Attempting to force activate Facebook Pixel: ${pixelId}`)

    // Clear existing Facebook Pixel if any
    delete window.fbq
    delete window._fbq

    // Remove existing Facebook scripts
    const existingScripts = document.querySelectorAll(`script[src*="fbevents.js"]`)
    existingScripts.forEach((script) => script.remove())

    try {
      // Initialize Facebook Pixel with the exact code and error handling
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

        // Add comprehensive error handling
        t.onerror = () => {
          console.warn("Facebook Pixel script blocked or failed to load")
          // Create a dummy fbq function to prevent errors
          if (!f.fbq) {
            f.fbq = (...args: any[]) => {
              console.log("Facebook Pixel call (blocked):", args)
            }
          }
        }

        t.onload = () => {
          console.log("Facebook Pixel script loaded successfully via force activation")
        }

        s = b.getElementsByTagName(e)[0]
        s.parentNode.insertBefore(t, s)
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")

      // Initialize and track with delay and error handling
      setTimeout(() => {
        try {
          if (window.fbq) {
            window.fbq("init", pixelId)
            window.fbq("track", "PageView")
            console.log(`Facebook Pixel force activated successfully with ID: ${pixelId}`)
          } else {
            console.warn("Facebook Pixel fbq function not available after force activation")
          }
        } catch (error) {
          console.warn("Facebook Pixel force activation error:", error)
        }
      }, 200)
    } catch (error) {
      console.warn("Facebook Pixel force activation setup error:", error)
    }
  }

  // Function to force GA cookies creation and activation
  const forceActivateAnalytics = () => {
    if (typeof window === "undefined") return

    const gaId = "G-WZ0WCHZ3XT"

    // Completely clear previous GA resources
    const existingScripts = document.querySelectorAll(`script[src*="googletagmanager.com"]`)
    existingScripts.forEach((script) => script.remove())

    // Clear global variables
    delete window.gtag
    delete window.dataLayer

    // Create new dataLayer
    window.dataLayer = []

    // Create gtag function
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }

    // Set time
    window.gtag("js", new Date())

    // Set consent as granted
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      functionality_storage: "granted",
      personalization_storage: "granted",
      security_storage: "granted",
    })

    // Create new script
    const script = document.createElement("script")
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}&t=${Date.now()}`

    script.onload = () => {
      // Configure GA4
      window.gtag("config", gaId, {
        send_page_view: true,
        page_title: document.title,
        page_location: window.location.href,
        transport_type: "beacon",
        cookie_domain: window.location.hostname,
        cookie_flags: "SameSite=Lax",
      })

      // Send events for activation
      setTimeout(() => {
        window.gtag("event", "page_view", {
          page_title: document.title,
          page_location: window.location.href,
          send_to: gaId,
          transport_type: "beacon",
        })

        window.gtag("event", "analytics_force_activated", {
          event_category: "consent",
          event_label: "force_activation_without_reload",
          send_to: gaId,
          transport_type: "beacon",
        })

        // Force cookie creation through direct GA call
        window.gtag("event", "user_engagement", {
          engagement_time_msec: 1,
          send_to: gaId,
          transport_type: "beacon",
        })
      }, 500)
    }

    script.onerror = () => {
      console.warn("Google Analytics script failed to load")
    }

    document.head.appendChild(script)

    // Additionally force cookie creation through iframe
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    iframe.src = `https://www.google-analytics.com/analytics.js?t=${Date.now()}`
    document.body.appendChild(iframe)
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1000)
  }

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const consentDate = new Date(parsed.consentDate)
        const now = new Date()
        const daysDiff = (now.getTime() - consentDate.getTime()) / (1000 * 3600 * 24)

        if (daysDiff < CONSENT_EXPIRY_DAYS) {
          setState({
            consent: parsed.consent,
            showBanner: false,
            hasInteracted: true,
            consentDate: parsed.consentDate,
          })
        } else {
          setState((prev) => ({ ...prev, showBanner: true }))
        }
      } catch (error) {
        setState((prev) => ({ ...prev, showBanner: true }))
      }
    } else {
      setState((prev) => ({ ...prev, showBanner: true }))
    }
  }, [])

  const saveConsent = (consent: CookieConsent, previousConsent?: CookieConsent) => {
    const consentData = {
      consent,
      consentDate: new Date().toISOString(),
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData))

    // Handle consent changes
    if (previousConsent) {
      // Clear when consent is revoked
      if (previousConsent.analytics && !consent.analytics) {
        forceClearCookies("analytics")
      }
      if (previousConsent.marketing && !consent.marketing) {
        forceClearCookies("marketing")
      }
    }

    setState({
      consent,
      showBanner: false,
      hasInteracted: true,
      consentDate: consentData.consentDate,
    })

    // Activation when consent is granted
    if (consent.analytics && (!previousConsent || !previousConsent.analytics)) {
      setTimeout(() => {
        forceActivateAnalytics()
      }, 200)
    }

    // Activate Facebook Pixel when marketing consent is granted
    if (consent.marketing && (!previousConsent || !previousConsent.marketing)) {
      setTimeout(async () => {
        try {
          // Get Facebook Pixel ID from settings
          const response = await fetch("/api/admin/cookie-settings")
          if (response.ok) {
            const settings = await response.json()
            if (settings.facebook_pixel_id) {
              forceActivateFacebookPixel(settings.facebook_pixel_id)
            } else {
              // Fallback to hardcoded ID if settings fail
              forceActivateFacebookPixel("1823195131746594")
            }
          } else {
            // Fallback to hardcoded ID if settings fail
            forceActivateFacebookPixel("1823195131746594")
          }
        } catch (error) {
          console.warn("Could not activate Facebook Pixel:", error)
          // Fallback to hardcoded ID
          forceActivateFacebookPixel("1823195131746594")
        }
      }, 200)
    }
  }

  const acceptAll = () => {
    const previousConsent = state.consent
    saveConsent(
      {
        necessary: true,
        analytics: true,
        marketing: true,
      },
      previousConsent,
    )
  }

  const acceptNecessary = () => {
    const previousConsent = state.consent
    saveConsent(
      {
        necessary: true,
        analytics: false,
        marketing: false,
      },
      previousConsent,
    )
  }

  const updateCategory = (category: keyof CookieConsent, value: boolean) => {
    setState((prev) => ({
      ...prev,
      consent: {
        ...prev.consent,
        [category]: category === "necessary" ? true : value,
      },
    }))
  }

  const saveCurrentSettings = () => {
    const previousConsent = { ...state.consent }
    saveConsent(state.consent, previousConsent)
  }

  const setShowBanner = (show: boolean) => {
    setState((prev) => ({ ...prev, showBanner: show }))
  }

  return {
    ...state,
    acceptAll,
    acceptNecessary,
    updateCategory,
    saveCurrentSettings,
    setShowBanner,
  }
}
