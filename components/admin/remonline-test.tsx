"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, TestTube, AlertTriangle, Info } from "lucide-react"
import { toast } from "sonner"

interface TestResult {
  success: boolean
  message: string
  error?: string
  details?: any
  tests?: {
    connection: {
      success: boolean
      message: string
      endpoint?: string
      data?: any
      details?: any
    }
    branches: {
      success: boolean
      count: number
      message: string
    }
    clients: {
      success: boolean
      count: number
      total: number
      message: string
    }
    orderStatuses: {
      success: boolean
      count: number
      message: string
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
      console.log("Starting RemOnline API test...")
      const response = await fetch("/api/admin/test-remonline")
      const data = await response.json()

      console.log("Test response:", data)

      if (response.ok) {
        setTestResult(data)
        if (data.success) {
          toast.success("RemOnline API test completed successfully")
        } else {
          toast.error("RemOnline API test failed")
        }
      } else {
        console.error("Test failed with status:", response.status, data)
        toast.error(`Test failed: ${data.error || "Unknown error"}`)
        setTestResult({
          success: false,
          message: data.error || "Unknown error",
          error: data.error,
          details: data.details,
        })
      }
    } catch (error) {
      console.error("Error running RemOnline test:", error)
      toast.error("Failed to run test - network error")
      setTestResult({
        success: false,
        message: "Network error",
        error: "Network error",
        details: error instanceof Error ? error.message : String(error),
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
        <CardDescription>
          Test the connection and functionality of the RemOnline API integration using Bearer token authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-4 w-4 text-blue-600" />
          <div className="text-sm text-blue-800">
            <strong>API Info:</strong> Using Bearer token authentication with rate limit of 3 requests/second. Testing
            multiple endpoints for compatibility.
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <div className="text-sm text-amber-800">
            <strong>Note:</strong> If you're getting "Invalid JSON payload" errors, make sure your API key is valid and
            has the correct permissions.
          </div>
        </div>

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

            {testResult.tests ? (
              <div className="grid gap-3">
                {/* Connection Test */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">API Connection</div>
                    <div className="text-sm text-muted-foreground">{testResult.tests.connection.message}</div>
                    {testResult.tests.connection.endpoint && (
                      <div className="text-xs text-green-600 mt-1">
                        Working endpoint: {testResult.tests.connection.endpoint}
                      </div>
                    )}
                    {testResult.tests.connection.details && (
                      <div className="text-xs text-red-600 mt-1">
                        Details: {JSON.stringify(testResult.tests.connection.details, null, 2)}
                      </div>
                    )}
                  </div>
                  <Badge variant={testResult.tests.connection.success ? "default" : "destructive"}>
                    {testResult.tests.connection.success ? "Success" : "Failed"}
                  </Badge>
                </div>

                {/* Branches Test */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Branches Endpoint</div>
                    <div className="text-sm text-muted-foreground">
                      {testResult.tests.branches.message}
                      {testResult.tests.branches.success && ` (${testResult.tests.branches.count} branches)`}
                    </div>
                  </div>
                  <Badge variant={testResult.tests.branches.success ? "default" : "destructive"}>
                    {testResult.tests.branches.success ? "Success" : "Failed"}
                  </Badge>
                </div>

                {/* Clients Test */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Clients Endpoint</div>
                    <div className="text-sm text-muted-foreground">
                      {testResult.tests.clients.message}
                      {testResult.tests.clients.success &&
                        ` (${testResult.tests.clients.count} of ${testResult.tests.clients.total} clients)`}
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
                      {testResult.tests.orderStatuses.message}
                      {testResult.tests.orderStatuses.success && ` (${testResult.tests.orderStatuses.count} statuses)`}
                    </div>
                  </div>
                  <Badge variant={testResult.tests.orderStatuses.success ? "default" : "destructive"}>
                    {testResult.tests.orderStatuses.success ? "Success" : "Failed"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  <strong>Error:</strong> {testResult.message}
                  {testResult.details && (
                    <pre className="mt-2 text-xs overflow-auto">
                      {typeof testResult.details === "string"
                        ? testResult.details
                        : JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {!testResult.success && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  <strong>Troubleshooting:</strong>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Check that REMONLINE_API_KEY environment variable is set correctly</li>
                    <li>Verify the API key is valid and active in your RemOnline account</li>
                    <li>Make sure the API key has the necessary permissions (read access to clients, orders, etc.)</li>
                    <li>Ensure you're not exceeding the rate limit (3 requests/second)</li>
                    <li>Check RemOnline API status and documentation for any recent changes</li>
                    <li>Try regenerating your API key in RemOnline settings if the current one is old</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Debug Information */}
            <details className="p-3 bg-gray-50 border rounded-lg">
              <summary className="cursor-pointer text-sm font-medium">Debug Information</summary>
              <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
