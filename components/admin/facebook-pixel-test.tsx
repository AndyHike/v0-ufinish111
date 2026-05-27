"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  TestTube,
  Eye,
  Zap,
  Navigation,
  Play,
  Cookie,
  Wifi,
  WifiOff,
  RefreshCw,
  Globe,
} from "lucide-react"

declare global {
  interface Window {
    testFacebookPixel?: () => void
    FB_PIXEL_INITIALIZED?: boolean
  }
}

interface FacebookPixelTestResults {
  pixelLoaded: boolean
  pixelInitialized: boolean
  cookiesPresent: boolean
  fbpCookie: boolean
  fbcCookie: boolean
  duplicateCookies: boolean
  eventsWorking: boolean
  connectionWorking: boolean
  pixelId: string
  cookies: string[]
  allCookies: string
  fbqFunction: boolean
  fbqLoaded: boolean
  fbqCallMethod: boolean
  globalFlag: boolean
  errors: string[]
  warnings: string[]
  debugInfo: Record<string, unknown>
}

export function FacebookPixelTest() {
  const [testResults, setTestResults] = useState<FacebookPixelTestResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [eventLog, setEventLog] = useState<string[]>([])
  const [pixelStatus, setPixelStatus] = useState<string>("Unknown")
  const [connectionStatus, setConnectionStatus] = useState<string>("Unknown")

  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || ""

  // Слухаємо події ініціалізації Facebook Pixel
  useEffect(() => {
    const handlePixelInitialized = (event: CustomEvent) => {
      console.log("🎉 Facebook Pixel initialized event received:", event.detail)
      setEventLog((prev) => [...prev, `🎉 Facebook Pixel initialized: ${event.detail.pixelId}`])
      setPixelStatus("Initialized & Active")
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

  // Функція для тестування з'єднання з Facebook
  const testFacebookConnection = async () => {
    if (!pixelId) {
      setEventLog((prev) => [...prev, `❌ Facebook Pixel ID not found in environment variables`])
      setConnectionStatus("Error")
      return false
    }

    setEventLog((prev) => [...prev, `🔗 Testing connection to Facebook servers...`])
    setConnectionStatus("Testing...")

    try {
      const testPromises: Promise<boolean>[] = []

      // Тест 1: Основний Facebook Pixel endpoint
      const img1 = new Image()
      const promise1 = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000)
        img1.onload = () => {
          clearTimeout(timeout)
          resolve(true)
        }
        img1.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }
      })
      img1.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1&t=${Date.now()}`
      testPromises.push(promise1)

      // Тест 2: Facebook Connect endpoint
      const img2 = new Image()
      const promise2 = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000)
        img2.onload = () => {
          clearTimeout(timeout)
          resolve(true)
        }
        img2.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }
      })
      img2.src = `https://connect.facebook.net/en_US/fbevents.js?t=${Date.now()}`
      testPromises.push(promise2)

      // Тест 3: Facebook Graph API (базова перевірка)
      const fetchPromise = fetch("https://graph.facebook.com/", {
        method: "GET",
        mode: "no-cors",
        cache: "no-cache",
      })
        .then(() => true)
        .catch(() => false)
      testPromises.push(fetchPromise)

      const results = await Promise.all(testPromises)
      const successCount = results.filter(Boolean).length
      const connected = successCount >= 1

      setConnectionStatus(connected ? "Connected" : "Disconnected")

      if (connected) {
        setEventLog((prev) => [...prev, `✅ Facebook servers reachable (${successCount}/3 tests passed)`])
      } else {
        setEventLog((prev) => [...prev, `❌ Cannot reach Facebook servers (0/3 tests passed)`])
        setEventLog((prev) => [...prev, `⚠️ This may be due to ad blockers or network restrictions`])
      }

      return connected
    } catch (error) {
      setEventLog((prev) => [...prev, `❌ Connection test failed: ${error}`])
      setConnectionStatus("Error")
      return false
    }
  }

  const runComprehensivePixelTest = async () => {
    if (!pixelId) {
      setEventLog((prev) => [...prev, `❌ Facebook Pixel ID not configured`])
      return
    }

    setIsLoading(true)

    const results: FacebookPixelTestResults = {
      pixelLoaded: false,
      pixelInitialized: false,
      cookiesPresent: false,
      fbpCookie: false,
      fbcCookie: false,
      duplicateCookies: false,
      eventsWorking: false,
      connectionWorking: false,
      pixelId: pixelId,
      cookies: [],
      allCookies: "",
      fbqFunction: false,
      fbqLoaded: false,
      fbqCallMethod: false,
      globalFlag: false,
      errors: [],
      warnings: [],
      debugInfo: {},
    }

    try {
      // Тест з'єднання
      results.connectionWorking = await testFacebookConnection()

      // Перевіряємо глобальний флаг
      results.globalFlag = !!window.FB_PIXEL_INITIALIZED

      // Перевіряємо fbq функцію
      if (typeof window !== "undefined" && window.fbq) {
        results.pixelLoaded = true
        results.fbqFunction = typeof window.fbq === "function"
        results.fbqLoaded = !!window.fbq.loaded
        results.fbqCallMethod = !!window.fbq.callMethod

        if (window.fbq.loaded && window.fbq.callMethod) {
          results.pixelInitialized = true
        }

        results.debugInfo = {
          fbqVersion: window.fbq.version || "unknown",
          fbqQueue: window.fbq.queue ? window.fbq.queue.length : 0,
          fbqLoaded: window.fbq.loaded || false,
          fbqCallMethod: !!window.fbq.callMethod,
          currentUrl: window.location.href,
          pageTitle: document.title,
          globalFlag: window.FB_PIXEL_INITIALIZED,
          userAgent: navigator.userAgent.substring(0, 100) + "...",
          timestamp: new Date().toISOString(),
          pixelId: pixelId,
        }
      }

      // Детальна перевірка cookies
      if (typeof document !== "undefined") {
        results.allCookies = document.cookie
        const cookies = document.cookie.split(";")

        // Перевіряємо наявність Facebook cookies
        const fbpCookies = cookies.filter((cookie) => cookie.trim().startsWith("_fbp="))
        const fbcCookies = cookies.filter((cookie) => cookie.trim().startsWith("_fbc="))

        results.fbpCookie = fbpCookies.length > 0
        results.fbcCookie = fbcCookies.length > 0
        results.duplicateCookies = fbpCookies.length > 1 || fbcCookies.length > 1

        if (results.duplicateCookies) {
          results.warnings.push(`Duplicate cookies detected: ${fbpCookies.length} _fbp, ${fbcCookies.length} _fbc`)
        }

        const allFbCookies = cookies.filter(
          (cookie) =>
            cookie.trim().startsWith("_fbp=") ||
            cookie.trim().startsWith("_fbc=") ||
            cookie.trim().startsWith("fr=") ||
            cookie.includes("facebook"),
        )

        if (allFbCookies.length > 0) {
          results.cookiesPresent = true
          results.cookies = allFbCookies.map((c) => c.trim())
        }
      }

      // Тестуємо відправку подій
      if (window.fbq && results.pixelInitialized && results.connectionWorking) {
        try {
          const testEventId = Math.random().toString(36).substring(7)

          setEventLog((prev) => [...prev, `🧪 Sending comprehensive test events...`])

          // Відправляємо різноманітні події
          window.fbq("trackCustom", "AdminPixelTest", {
            test_timestamp: new Date().toISOString(),
            test_source: "admin_panel_comprehensive",
            test_id: testEventId,
            page_url: window.location.href,
            connection_status: "working",
          })

          window.fbq("track", "PageView", {
            source: "admin_test",
            page_url: window.location.href,
            test_id: testEventId,
          })

          window.fbq("track", "ViewContent", {
            content_type: "website",
            content_name: "Admin Test Content",
            source: "admin_test",
            value: 1.5,
            currency: "CZK",
            test_id: testEventId,
          })

          window.fbq("track", "Purchase", {
            value: 2.99,
            currency: "CZK",
            content_type: "test_purchase",
            source: "admin_comprehensive_test",
            test_id: testEventId,
          })

          window.fbq("track", "Lead", {
            content_name: "Admin Test Lead",
            source: "admin_test",
            value: 5.0,
            currency: "CZK",
            test_id: testEventId,
          })

          results.eventsWorking = true

          setEventLog((prev) => [
            ...prev,
            `✅ AdminPixelTest event sent (ID: ${testEventId})`,
            `✅ PageView event sent`,
            `✅ ViewContent event sent (value: 1.50 CZK)`,
            `✅ Purchase event sent (value: 2.99 CZK)`,
            `✅ Lead event sent (value: 5.00 CZK)`,
          ])

          // Додатково через noscript для максимальної надійності
          const comprehensiveImg = new Image()
          const testTimestamp = Date.now()
          comprehensiveImg.src = `https://www.facebook.com/tr?id=${pixelId}&ev=Purchase&noscript=1&cd[test]=comprehensive&cd[test_id]=${testEventId}&cd[timestamp]=${testTimestamp}&cd[value]=2.99&cd[currency]=CZK&cd[source]=admin_panel`
          document.body.appendChild(comprehensiveImg)

          setEventLog((prev) => [...prev, `📡 Noscript backup event sent`])

          setTimeout(() => {
            if (document.body.contains(comprehensiveImg)) {
              document.body.removeChild(comprehensiveImg)
            }
          }, 10000)
        } catch (error) {
          results.errors.push(`Event tracking error: ${error}`)
          setEventLog((prev) => [...prev, `❌ Error sending events: ${error}`])
        }
      }

      // Аналіз проблем та рекомендації
      if (!results.connectionWorking) {
        results.errors.push("Cannot connect to Facebook servers")
        results.errors.push("Possible causes: Ad blockers, firewall, DNS issues")
        results.errors.push("Try disabling ad blockers and testing again")
      }

      if (!results.fbpCookie) {
        results.errors.push("_fbp cookie missing - required for Facebook tracking")
      }

      if (!results.fbcCookie) {
        results.warnings.push("_fbc cookie missing - helps with attribution accuracy")
      }

      if (results.duplicateCookies) {
        results.warnings.push("Duplicate cookies detected - may cause tracking issues")
      }

      if (!results.pixelInitialized && results.pixelLoaded) {
        results.errors.push("Pixel script loaded but not properly initialized")
      }

      if (!results.fbqCallMethod && results.fbqFunction) {
        results.errors.push("fbq function exists but callMethod not available")
      }

      if (results.cookiesPresent && results.pixelInitialized && results.connectionWorking && !results.eventsWorking) {
        results.errors.push("All components working but events failed to send")
      }

      if (!results.globalFlag) {
        results.warnings.push("Global initialization flag not set")
      }
    } catch (error) {
      results.errors.push(`Comprehensive test error: ${error}`)
    }

    setTimeout(() => {
      setTestResults(results)
      setIsLoading(false)
    }, 1500)
  }

  const forceCreateOptimizedCookies = () => {
    if (typeof document === "undefined" || !pixelId) return

    const currentDomain = window.location.hostname
    const baseDomain = currentDomain.replace(/^www\./, "")

    setEventLog((prev) => [...prev, `🍪 Creating optimized cookies for domain: .${baseDomain}`])

    // Створюємо _fbp cookie
    const fbpValue = `fb.1.${Date.now()}.${Math.random().toString(36).substring(2, 15)}`
    const fbpExpires = new Date()
    fbpExpires.setFullYear(fbpExpires.getFullYear() + 1)

    const fbpCookie = `_fbp=${fbpValue}; expires=${fbpExpires.toUTCString()}; path=/; domain=.${baseDomain}; SameSite=Lax`
    document.cookie = fbpCookie

    // Створюємо _fbc cookie
    const fbcValue = `fb.1.${Date.now()}.${pixelId}`
    const fbcExpires = new Date()
    fbcExpires.setDate(fbcExpires.getDate() + 7)

    const fbcCookie = `_fbc=${fbcValue}; expires=${fbcExpires.toUTCString()}; path=/; domain=.${baseDomain}; SameSite=Lax`
    document.cookie = fbcCookie

    setEventLog((prev) => [
      ...prev,
      `🍪 Created _fbp cookie: ${fbpValue}`,
      `🍪 Created _fbc cookie: ${fbcValue}`,
      `🍪 Domain: .${baseDomain}`,
    ])

    // Перевіряємо через 500мс
    setTimeout(() => {
      const currentCookies = document.cookie
      const fbpExists = currentCookies.includes("_fbp")
      const fbcExists = currentCookies.includes("_fbc")

      setEventLog((prev) => [
        ...prev,
        `🔍 Cookie verification: _fbp=${fbpExists}, _fbc=${fbcExists}`,
        `🔍 All cookies: ${currentCookies}`,
      ])

      runComprehensivePixelTest()
    }, 500)
  }

  const testNavigation = () => {
    if (window.fbq && pixelId) {
      const testPages = ["/", "/contact", "/brands/apple", "/models/iphone-14", "/series/iphone"]
      const currentPage = testPages[Math.floor(Math.random() * testPages.length)]
      const testId = Math.random().toString(36).substring(7)

      window.fbq("trackCustom", "NavigationTest", {
        test_page: currentPage,
        timestamp: new Date().toISOString(),
        test_source: "admin_navigation_test",
        test_id: testId,
      })

      window.fbq("track", "PageView", {
        source: "navigation_test",
        test_page: currentPage,
        test_id: testId,
      })

      setEventLog((prev) => [...prev, `🧭 Navigation test: ${currentPage} (ID: ${testId})`])
    } else {
      setEventLog((prev) => [...prev, `❌ fbq not available for navigation test`])
    }
  }

  const runManualTest = () => {
    if (window.testFacebookPixel) {
      window.testFacebookPixel()
      setEventLog((prev) => [...prev, `🧪 Manual test function executed`])
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

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "Connected":
        return <Wifi className="h-4 w-4 text-green-500" />
      case "Disconnected":
        return <WifiOff className="h-4 w-4 text-red-500" />
      case "Testing...":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Globe className="h-4 w-4 text-gray-500" />
    }
  }

  if (!pixelId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Facebook Pixel Configuration Error
          </CardTitle>
          <CardDescription>
            Facebook Pixel ID is not configured. Please set NEXT_PUBLIC_FACEBOOK_PIXEL_ID environment variable.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Facebook Pixel Comprehensive Test & Debug
        </CardTitle>
        <CardDescription>
          Advanced testing and debugging for Facebook Pixel implementation
          <br />
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">Pixel ID: {pixelId}</Badge>
            <Badge variant="outline">Status: {pixelStatus}</Badge>
            <Badge
              variant={connectionStatus === "Connected" ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {getConnectionIcon()}
              {connectionStatus}
            </Badge>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={runComprehensivePixelTest} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Run Full Test
              </>
            )}
          </Button>

          <Button onClick={testFacebookConnection} variant="outline" disabled={isLoading}>
            <Wifi className="mr-2 h-4 w-4" />
            Test Connection
          </Button>

          <Button onClick={forceCreateOptimizedCookies} variant="outline" disabled={isLoading}>
            <Cookie className="mr-2 h-4 w-4" />
            Create Optimized Cookies
          </Button>

          <Button onClick={testNavigation} variant="outline" disabled={isLoading}>
            <Navigation className="mr-2 h-4 w-4" />
            Test Navigation
          </Button>

          <Button onClick={runManualTest} variant="outline" disabled={isLoading}>
            <Play className="mr-2 h-4 w-4" />
            Manual Test
          </Button>

          <Button onClick={clearEventLog} variant="outline" disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear Log
          </Button>
        </div>

        {eventLog.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Real-time Event Log:</h4>
            <div className="max-h-48 overflow-y-auto space-y-1 border rounded p-2">
              {eventLog.slice(-20).map((log, index) => (
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
              <h3 className="font-medium">Comprehensive Test Results</h3>

              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.connectionWorking)}
                    <span>Facebook Server Connection</span>
                  </div>
                  {getStatusBadge(testResults.connectionWorking, "Working", "Failed")}
                </div>

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
                    {getStatusIcon(testResults.fbqCallMethod)}
                    <span>fbq CallMethod Ready</span>
                  </div>
                  {getStatusBadge(testResults.fbqCallMethod, "Ready", "Not Ready")}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.pixelInitialized)}
                    <span>Pixel Fully Initialized</span>
                  </div>
                  {getStatusBadge(testResults.pixelInitialized, "Initialized", "Not Initialized")}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.fbpCookie)}
                    <span>_fbp Cookie Present</span>
                  </div>
                  {getStatusBadge(testResults.fbpCookie, "Present", "Missing")}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.fbcCookie)}
                    <span>_fbc Cookie Present</span>
                  </div>
                  {getStatusBadge(testResults.fbcCookie, "Present", "Missing")}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.eventsWorking)}
                    <span>Event Tracking Working</span>
                  </div>
                  {getStatusBadge(testResults.eventsWorking, "Working", "Not Working")}
                </div>

                {testResults.duplicateCookies && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>Duplicate Cookies Detected</span>
                    </div>
                    <Badge variant="secondary">Warning</Badge>
                  </div>
                )}
              </div>

              {testResults.debugInfo && Object.keys(testResults.debugInfo).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Debug Information:</h4>
                  <div className="text-xs font-mono bg-muted p-2 rounded max-h-32 overflow-y-auto">
                    {JSON.stringify(testResults.debugInfo, null, 2)}
                  </div>
                </div>
              )}

              {testResults.cookies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Facebook Cookies Found:</h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {testResults.cookies.map((cookie: string, index: number) => (
                      <div key={index} className="text-xs font-mono bg-green-50 p-2 rounded border border-green-200">
                        {cookie}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResults.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-yellow-600">Warnings:</h4>
                  <div className="space-y-1">
                    {testResults.warnings.map((warning: string, index: number) => (
                      <div key={index} className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                        ⚠️ {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResults.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-600">Critical Issues:</h4>
                  <div className="space-y-1">
                    {testResults.errors.map((error: string, index: number) => (
                      <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        ❌ {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Eye className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">How to verify in Facebook Events Manager:</p>
                    <ol className="mt-1 list-decimal list-inside space-y-1 text-xs">
                      <li>
                        Go to <strong>Facebook Events Manager</strong>
                      </li>
                      <li>
                        Select your Pixel (ID: <strong>{pixelId}</strong>)
                      </li>
                      <li>
                        Click on <strong>"Test Events"</strong> tab
                      </li>
                      <li>
                        Look for events from <strong>devicehelp.cz</strong>
                      </li>
                      <li>
                        Events should appear within <strong>1-2 minutes</strong>
                      </li>
                      <li>
                        Check for <strong>Purchase, PageView, ViewContent, Lead</strong> events
                      </li>
                      <li>Verify event parameters and values are correct</li>
                      <li>Test navigation between different pages</li>
                    </ol>
                    <p className="mt-2 text-xs font-medium">
                      💡 If events don't appear, check the connection status and error messages above.
                    </p>
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
