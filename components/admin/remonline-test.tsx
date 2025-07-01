"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, TestTube } from "lucide-react"
import { toast } from "sonner"

interface TestResult {
  success: boolean
  message: string
  tests: {
    connection: {
      success: boolean
      message: string
      data?: any
    }
    clients: {
      success: boolean
      count: number
      total: number
    }
    orderStatuses: {
      success: boolean
      count: number
    }
  }
}

export function RemOnlineTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const runTest = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/admin/test-remonline")
      const data = await response.json()

      if (response.ok) {
        setTestResult(data)
        toast.success("RemOnline API test completed")
      } else {
        toast.error(`Test failed: ${data.error}`)
        setTestResult({
          success: false,
          message: data.error,
          tests: {
            connection: { success: false, message: data.error },
            clients: { success: false, count: 0, total: 0 },
            orderStatuses: { success: false, count: 0 },
          },
        })
      }
    } catch (error) {
      console.error("Error running RemOnline test:", error)
      toast.error("Failed to run test")
      setTestResult({
        success: false,
        message: "Network error",
        tests: {
          connection: { success: false, message: "Network error" },
          clients: { success: false, count: 0, total: 0 },
          orderStatuses: { success: false, count: 0 },
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          RemOnline API Test
        </CardTitle>
        <CardDescription>Test the connection and functionality of the RemOnline API integration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTest} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <TestTube className="mr-2 h-4 w-4" />
              Run API Tests
            </>
          )}
        </Button>

        {testResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">Overall Status: {testResult.success ? "Success" : "Failed"}</span>
            </div>

            <div className="grid gap-3">
              {/* Connection Test */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">API Connection</div>
                  <div className="text-sm text-muted-foreground">{testResult.tests.connection.message}</div>
                </div>
                <Badge variant={testResult.tests.connection.success ? "default" : "destructive"}>
                  {testResult.tests.connection.success ? "Success" : "Failed"}
                </Badge>
              </div>

              {/* Clients Test */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Clients Endpoint</div>
                  <div className="text-sm text-muted-foreground">
                    {testResult.tests.clients.success
                      ? `Fetched ${testResult.tests.clients.count} clients (${testResult.tests.clients.total} total)`
                      : "Failed to fetch clients"}
                  </div>
                </div>
                <Badge variant={testResult.tests.clients.success ? "default" : "destructive"}>
                  {testResult.tests.clients.success ? "Success" : "Failed"}
                </Badge>
              </div>

              {/* Order Statuses Test */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Order Statuses</div>
                  <div className="text-sm text-muted-foreground">
                    {testResult.tests.orderStatuses.success
                      ? `Fetched ${testResult.tests.orderStatuses.count} order statuses`
                      : "Failed to fetch order statuses"}
                  </div>
                </div>
                <Badge variant={testResult.tests.orderStatuses.success ? "default" : "destructive"}>
                  {testResult.tests.orderStatuses.success ? "Success" : "Failed"}
                </Badge>
              </div>
            </div>

            {!testResult.success && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  <strong>Troubleshooting:</strong>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Check that REMONLINE_API_KEY environment variable is set</li>
                    <li>Verify the API key is valid and active</li>
                    <li>Ensure you're not exceeding the rate limit (3 requests/second)</li>
                    <li>Check RemOnline API status</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
