"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, TestTube, CheckCircle, XCircle, Clock, Database, User, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

export function RemOnlineApiTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [orderId, setOrderId] = useState("")
  const [clientId, setClientId] = useState("")

  const testApiConnection = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      console.log("🔍 Testing RemOnline API connection...")

      const response = await fetch("/api/admin/test-remonline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "test_connection",
        }),
      })

      const result = await response.json()

      setTestResult({
        success: response.ok && result.success,
        status: response.status,
        data: result,
        timestamp: new Date().toISOString(),
        type: "connection_test",
      })

      if (response.ok && result.success) {
        toast.success("RemOnline API connection successful!")
      } else {
        toast.error(`API test failed: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("API test error:", error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        type: "connection_test",
      })
      toast.error("Failed to test API connection")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrderById = async () => {
    if (!orderId.trim()) {
      toast.error("Please enter an Order ID")
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      console.log("📦 Fetching order by ID:", orderId)

      const response = await fetch("/api/admin/test-remonline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_order",
          order_id: orderId,
        }),
      })

      const result = await response.json()

      setTestResult({
        success: response.ok && result.success,
        status: response.status,
        data: result,
        timestamp: new Date().toISOString(),
        type: "order_fetch",
      })

      if (response.ok && result.success) {
        toast.success("Order fetched successfully!")
      } else {
        toast.error(`Failed to fetch order: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Order fetch error:", error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        type: "order_fetch",
      })
      toast.error("Failed to fetch order")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClientById = async () => {
    if (!clientId.trim()) {
      toast.error("Please enter a Client ID")
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      console.log("👤 Fetching client by ID:", clientId)

      const response = await fetch("/api/admin/test-remonline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_client",
          client_id: clientId,
        }),
      })

      const result = await response.json()

      setTestResult({
        success: response.ok && result.success,
        status: response.status,
        data: result,
        timestamp: new Date().toISOString(),
        type: "client_fetch",
      })

      if (response.ok && result.success) {
        toast.success("Client fetched successfully!")
      } else {
        toast.error(`Failed to fetch client: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Client fetch error:", error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        type: "client_fetch",
      })
      toast.error("Failed to fetch client")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2)
    } catch {
      return String(obj)
    }
  }

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case "connection_test":
        return <Settings className="h-4 w-4" />
      case "order_fetch":
        return <ShoppingCart className="h-4 w-4" />
      case "client_fetch":
        return <User className="h-4 w-4" />
      default:
        return <TestTube className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* API Connection Test */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Settings className="h-5 w-5" />
            RemOnline API Connection
          </CardTitle>
          <CardDescription className="text-purple-700">
            Test your RemOnline API credentials and connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-2">Environment Variables</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>REMONLINE_API_KEY:</strong>{" "}
                  <Badge variant={process.env.REMONLINE_API_KEY ? "default" : "destructive"}>
                    {process.env.REMONLINE_API_KEY ? "Set" : "Not Set"}
                  </Badge>
                </p>
                <p>
                  <strong>REMONLINE_API_TOKEN:</strong>{" "}
                  <Badge variant={process.env.REMONLINE_API_TOKEN ? "default" : "destructive"}>
                    {process.env.REMONLINE_API_TOKEN ? "Set" : "Not Set"}
                  </Badge>
                </p>
              </div>
            </div>

            <Button onClick={testApiConnection} disabled={isLoading}>
              <TestTube className="h-4 w-4 mr-2" />
              Test API Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Fetching Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Fetching Tests
          </CardTitle>
          <CardDescription>Test fetching specific data from RemOnline API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Fetch */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="order-id">Order ID</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="order-id"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter RemOnline Order ID (e.g., 12345)"
                  className="flex-1"
                />
                <Button onClick={fetchOrderById} disabled={isLoading || !orderId.trim()}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Fetch Order
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Client Fetch */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="client-id">Client ID</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="client-id"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter RemOnline Client ID (e.g., 67890)"
                  className="flex-1"
                />
                <Button onClick={fetchClientById} disabled={isLoading || !clientId.trim()}>
                  <User className="h-4 w-4 mr-2" />
                  Fetch Client
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(testResult.success)}
              {getTestTypeIcon(testResult.type)}
              API Test Result
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? "Success" : "Failed"}
              </Badge>
              {testResult.status && <Badge variant="outline">HTTP {testResult.status}</Badge>}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {new Date(testResult.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="response" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="response">Response Data</TabsTrigger>
                <TabsTrigger value="details">Test Details</TabsTrigger>
              </TabsList>

              <TabsContent value="response" className="mt-4">
                <div>
                  <Label>API Response</Label>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-96 mt-2">
                    {formatJson(testResult.data || testResult.error)}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label>Test Information</Label>
                    <div className="bg-muted p-3 rounded text-sm mt-2">
                      <p>
                        <strong>Test Type:</strong> {testResult.type}
                      </p>
                      <p>
                        <strong>Status:</strong> {testResult.success ? "Success" : "Failed"}
                      </p>
                      <p>
                        <strong>HTTP Status:</strong> {testResult.status}
                      </p>
                      <p>
                        <strong>Timestamp:</strong> {testResult.timestamp}
                      </p>
                      {testResult.type === "order_fetch" && (
                        <p>
                          <strong>Order ID:</strong> {orderId}
                        </p>
                      )}
                      {testResult.type === "client_fetch" && (
                        <p>
                          <strong>Client ID:</strong> {clientId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {testResult.success && (
              <div className="mt-4 text-sm text-green-600 bg-green-50 p-3 rounded">
                ✅ API test completed successfully! Your RemOnline integration is working.
              </div>
            )}

            {!testResult.success && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded">
                ❌ API test failed. Please check your API credentials and network connection.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
