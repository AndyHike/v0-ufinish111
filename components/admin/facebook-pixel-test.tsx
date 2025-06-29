"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertCircle, TestTube, Eye, Zap } from "lucide-react"

export function FacebookPixelTest() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runPixelTest = () => {
    setIsLoading(true)

    const results = {
      pixelLoaded: false,
      pixelInitialized: false,
      cookiesPresent: false,
      eventsWorking: false,
      pixelId: "",
      cookies: [],
      errors: [],
    }

    try {
      // Перевіряємо чи завантажений fbq
      if (typeof window !== "undefined" && window.fbq) {
        results.pixelLoaded = true

        // Перевіряємо чи ініціалізований
        if (window.fbq.loaded) {
          results.pixelInitialized = true
        }
      }

      // Перевіряємо cookies
      if (typeof document !== "undefined") {
        const cookies = document.cookie.split(";")
        const fbCookies = cookies.filter(
          (cookie) =>
            cookie.trim().startsWith("_fbp=") || cookie.trim().startsWith("_fbc=") || cookie.trim().startsWith("fr="),
        )

        if (fbCookies.length > 0) {
          results.cookiesPresent = true
          results.cookies = fbCookies.map((c) => c.trim())
        }
      }

      // Тестуємо відправку події
      if (window.fbq && results.pixelInitialized) {
        try {
          window.fbq("trackCustom", "PixelTest", {
            test_timestamp: new Date().toISOString(),
            test_source: "admin_panel",
          })
          results.eventsWorking = true
        } catch (error) {
          results.errors.push(`Event tracking error: ${error}`)
        }
      }
    } catch (error) {
      results.errors.push(`General error: ${error}`)
    }

    setTimeout(() => {
      setTestResults(results)
      setIsLoading(false)
    }, 1000)
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
          Facebook Pixel Test
        </CardTitle>
        <CardDescription>Test if Facebook Pixel is working correctly on your site</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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

        {testResults && (
          <div className="space-y-4">
            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">Test Results</h3>

              <div className="grid gap-3">
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
              </div>

              {testResults.cookies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Facebook Cookies Found:</h4>
                  <div className="space-y-1">
                    {testResults.cookies.map((cookie: string, index: number) => (
                      <div key={index} className="text-xs font-mono bg-muted p-2 rounded">
                        {cookie}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResults.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-600">Errors:</h4>
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
                      <li>Select your Pixel</li>
                      <li>Check "Test Events" tab</li>
                      <li>Look for events from your domain</li>
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
