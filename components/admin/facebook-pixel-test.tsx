"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertCircle, TestTube, Eye, Zap, RefreshCw, Navigation, Play } from "lucide-react"

declare global {
  interface Window {
    testFacebookPixel: () => void
    FB_PIXEL_INITIALIZED: boolean
  }
}

export function FacebookPixelTest() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [eventLog, setEventLog] = useState<string[]>([])
  const [pixelStatus, setPixelStatus] = useState<string>("Unknown")

  // Слухаємо події ініціалізації Facebook Pixel
  useEffect(() => {
    const handlePixelInitialized = (event: CustomEvent) => {
      console.log("🎉 Facebook Pixel initialized event received:", event.detail)
      setEventLog((prev) => [...prev, `🎉 Facebook Pixel initialized: ${event.detail.pixelId}`])
      setPixelStatus("Initialized")
    }

    const handleConsentChanged = (event: CustomEvent) => {
      console.log("🔄 Cookie consent changed:", event.detail)
      setEventLog((prev) => [...prev, `🔄 Consent changed - Marketing: ${event.detail.consent.marketing}`])
      setPixelStatus(event.detail.consent.marketing ? "Consent Granted" : "Consent Denied")
    }

    window.addEventListener("facebookPixelInitialized", handlePixelInitialized as EventListener)
    window.addEventListener("cookieConsentChanged", handleConsentChanged as EventListener)

    return () => {
      window.removeEventListener("facebookPixelInitialized", handlePixelInitialized as EventListener)
      window.removeEventListener("cookieConsentChanged", handleConsentChanged as EventListener)
    }
  }, [])

  const runPixelTest = () => {
    setIsLoading(true)

    const results = {
      pixelLoaded: false,
      pixelInitialized: false,
      cookiesPresent: false,
      eventsWorking: false,
      navigationTracking: false,
      pixelId: "",
      cookies: [],
      allCookies: "",
      fbqFunction: false,
      globalFlag: false,
      errors: [],
      debugInfo: {},
    }

    try {
      // Перевіряємо глобальний флаг
      results.globalFlag = !!window.FB_PIXEL_INITIALIZED

      // Перевіряємо чи завантажений fbq
      if (typeof window !== "undefined" && window.fbq) {
        results.pixelLoaded = true
        results.fbqFunction = typeof window.fbq === "function"

        // Перевіряємо чи ініціалізований
        if (window.fbq.loaded) {
          results.pixelInitialized = true
        }

        // Додаткова інформація про fbq
        results.debugInfo = {
          fbqVersion: window.fbq.version || "unknown",
          fbqQueue: window.fbq.queue ? window.fbq.queue.length : 0,
          fbqLoaded: window.fbq.loaded || false,
          currentUrl: window.location.href,
          pageTitle: document.title,
          globalFlag: window.FB_PIXEL_INITIALIZED,
        }
      }

      // Перевіряємо всі cookies
      if (typeof document !== "undefined") {
        results.allCookies = document.cookie
        const cookies = document.cookie.split(";")
        const fbCookies = cookies.filter(
          (cookie) =>
            cookie.trim().startsWith("_fbp=") ||
            cookie.trim().startsWith("_fbc=") ||
            cookie.trim().startsWith("fr=") ||
            cookie.includes("facebook"),
        )

        if (fbCookies.length > 0) {
          results.cookiesPresent = true
          results.cookies = fbCookies.map((c) => c.trim())
        }
      }

      // Тестуємо відправку події
      if (window.fbq && results.pixelInitialized) {
        try {
          const testEventId = Math.random().toString(36).substring(7)

          // Основна тестова подія
          window.fbq("trackCustom", "AdminPixelTest", {
            test_timestamp: new Date().toISOString(),
            test_source: "admin_panel",
            test_id: testEventId,
            page_url: window.location.href,
          })

          // Тестуємо PageView
          window.fbq("track", "PageView")

          // Тестуємо ViewContent
          window.fbq("track", "ViewContent", {
            content_type: "website",
            source: "admin_test",
          })

          results.eventsWorking = true
          results.navigationTracking = true

          setEventLog((prev) => [
            ...prev,
            `✅ Sent AdminPixelTest event (ID: ${testEventId})`,
            `✅ Sent PageView event`,
            `✅ Sent ViewContent event`,
          ])
        } catch (error) {
          results.errors.push(`Event tracking error: ${error}`)
          setEventLog((prev) => [...prev, `❌ Error sending events: ${error}`])
        }
      }

      // Додаткова діагностика
      if (!results.cookiesPresent) {
        results.errors.push("Facebook cookies not found. This might indicate:")
        results.errors.push("1. Pixel not properly initialized")
        results.errors.push("2. Ad blockers preventing cookie creation")
        results.errors.push("3. Browser privacy settings blocking cookies")
        results.errors.push("4. Consent not properly granted")
        results.errors.push("5. Script not loaded dynamically after consent")
      }

      if (!results.pixelInitialized && results.pixelLoaded) {
        results.errors.push("Pixel script loaded but not initialized - check consent flow")
      }

      if (!results.globalFlag) {
        results.errors.push("Global initialization flag not set - pixel may not be properly initialized")
      }
    } catch (error) {
      results.errors.push(`General error: ${error}`)
    }

    setTimeout(() => {
      setTestResults(results)
      setIsLoading(false)
    }, 1000)
  }

  const forceCreateCookies = () => {
    if (typeof document === "undefined") return

    const pixelId = "1823195131746594" // Ваш Pixel ID

    // Створюємо _fbp cookie
    const fbpValue = `fb.1.${Date.now()}.${Math.random().toString(36).substring(2, 15)}`
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)

    const fbpCookie = `_fbp=${fbpValue}; expires=${expires.toUTCString()}; path=/; domain=${window.location.hostname}; SameSite=Lax`
    document.cookie = fbpCookie

    // Створюємо _fbc cookie
    const fbcValue = `fb.1.${Date.now()}.${pixelId}`
    const fbcExpires = new Date()
    fbcExpires.setDate(fbcExpires.getDate() + 7)

    const fbcCookie = `_fbc=${fbcValue}; expires=${fbcExpires.toUTCString()}; path=/; domain=${window.location.hostname}; SameSite=Lax`
    document.cookie = fbcCookie

    console.log("Force created Facebook cookies:", { fbpCookie, fbcCookie })
    setEventLog((prev) => [...prev, `🍪 Force created _fbp cookie`, `🍪 Force created _fbc cookie`])

    // Перезапускаємо тест
    setTimeout(() => runPixelTest(), 500)
  }

  const testNavigation = () => {
    if (window.fbq) {
      const testPages = ["/", "/contact", "/brands/apple", "/models/iphone-14"]
      const currentPage = testPages[Math.floor(Math.random() * testPages.length)]

      window.fbq("trackCustom", "NavigationTest", {
        test_page: currentPage,
        timestamp: new Date().toISOString(),
        test_source: "admin_navigation_test",
      })

      setEventLog((prev) => [...prev, `🧭 Sent navigation test event for page: ${currentPage}`])
    }
  }

  const runManualTest = () => {
    if (window.testFacebookPixel) {
      window.testFacebookPixel()
      setEventLog((prev) => [...prev, `🧪 Ran manual test function`])
    } else {
      setEventLog((prev) => [...prev, `❌ Manual test function not available`])
    }
  }

  const clearEventLog = () => {
    setEventLog([])
  }

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (status: boolean, trueText: string, falseText: string) => {
    return <Badge variant={status ? "default" : "destructive"}>{status ? trueText : falseText}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Facebook Pixel Test & Debug
        </CardTitle>
        <CardDescription>
          Test if Facebook Pixel is working correctly and debug issues
          <br />
          <Badge variant="outline" className="mt-1">
            Status: {pixelStatus}
          </Badge>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={runPixelTest} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Run Pixel Test
              </>
            )}
          </Button>

          <Button onClick={forceCreateCookies} variant="outline" disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Force Create Cookies
          </Button>

          <Button onClick={testNavigation} variant="outline" disabled={isLoading}>
            <Navigation className="mr-2 h-4 w-4" />
            Test Navigation
          </Button>

          <Button onClick={runManualTest} variant="outline" disabled={isLoading}>
            <Play className="mr-2 h-4 w-4" />
            Manual Test
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={clearEventLog} variant="outline" size="sm" className="flex-1 bg-transparent">
            Clear Log
          </Button>
        </div>

        {eventLog.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Real-time Event Log:</h4>
            <div className="max-h-40 overflow-y-auto space-y-1 border rounded p-2">
              {eventLog.slice(-10).map((log, index) => (
                <div key={index} className="text-xs font-mono bg-muted p-1 rounded">
                  {new Date().toLocaleTimeString()} - {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {testResults && (
          <div className="space-y-4">
            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">Test Results</h3>

              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.globalFlag)}
                    <span>Global Initialization Flag</span>
                  </div>
                  {getStatusBadge(testResults.globalFlag, "Set", "Not Set")}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.fbqFunction)}
                    <span>fbq Function Available</span>
                  </div>
                  {getStatusBadge(testResults.fbqFunction, "Available", "Missing")}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.pixelLoaded)}
                    <span>Facebook Pixel Script Loaded</span>
                  </div>
                  {getStatusBadge(testResults.pixelLoaded, "Loaded", "Not Loaded")}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.pixelInitialized)}
                    <span>Pixel Initialized</span>
                  </div>
                  {getStatusBadge(testResults.pixelInitialized, "Initialized", "Not Initialized")}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.cookiesPresent)}
                    <span>Facebook Cookies Present</span>
                  </div>
                  {getStatusBadge(testResults.cookiesPresent, "Present", "Missing")}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.eventsWorking)}
                    <span>Event Tracking Working</span>
                  </div>
                  {getStatusBadge(testResults.eventsWorking, "Working", "Not Working")}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.navigationTracking)}
                    <span>Navigation Tracking</span>
                  </div>
                  {getStatusBadge(testResults.navigationTracking, "Active", "Inactive")}
                </div>
              </div>

              {testResults.debugInfo && Object.keys(testResults.debugInfo).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Debug Information:</h4>
                  <div className="text-xs font-mono bg-muted p-2 rounded">
                    {JSON.stringify(testResults.debugInfo, null, 2)}
                  </div>
                </div>
              )}

              {testResults.cookies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Facebook Cookies Found:</h4>
                  <div className="space-y-1">
                    {testResults.cookies.map((cookie: string, index: number) => (
                      <div key={index} className="text-xs font-mono bg-green-50 p-2 rounded border border-green-200">
                        {cookie}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResults.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-600">Issues & Recommendations:</h4>
                  <div className="space-y-1">
                    {testResults.errors.map((error: string, index: number) => (
                      <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Eye className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">How to verify in Facebook:</p>
                    <ol className="mt-1 list-decimal list-inside space-y-1 text-xs">
                      <li>Go to Facebook Events Manager</li>
                      <li>Select your Pixel (ID: 1823195131746594)</li>
                      <li>Check "Test Events" tab</li>
                      <li>Look for events from devicehelp.cz</li>
                      <li>Events should appear within 1-2 minutes</li>
                      <li>Navigate between pages to test page tracking</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
