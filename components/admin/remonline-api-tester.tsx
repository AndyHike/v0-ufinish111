"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Clock, Search } from "lucide-react"
import { toast } from "sonner"

interface TestResult {
  success: boolean
  data?: any
  error?: string
  timestamp: string
  endpoint?: string
}

export function RemonlineApiTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [orderId, setOrderId] = useState("")
  const [clientId, setClientId] = useState("")

  const testApiCall = async (endpoint: string, params?: Record<string, string>) => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const url = new URL(`/api/admin/test-remonline`, window.location.origin)
      url.searchParams.set("endpoint", endpoint)

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) url.searchParams.set(key, value)
        })
      }

      console.log("🧪 Testing API call:", url.toString())

      const response = await fetch(url.toString())
      const result = await response.json()

      setTestResult({
        success: response.ok && result.success,
        data: result.data,
        error: result.error || result.message,
        timestamp: new Date().toISOString(),
        endpoint,
      })

      if (response.ok && result.success) {
        toast.success("API test successful!")
      } else {
        toast.error(`API test failed: ${result.error || result.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("API test error:", error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        endpoint,
      })
      toast.error("Failed to test API")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            RemOnline API Tester
          </CardTitle>
          <CardDescription>Test various RemOnline API endpoints with specific IDs</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connection" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="statuses">Statuses</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => testApiCall("auth")}
                  disabled={isLoading}
                  className="h-auto p-4 flex flex-col items-start"
                >
                  <div className="font-medium">Test Authentication</div>
                  <div className="text-sm opacity-70">Verify API key and connection</div>
                </Button>

                <Button
                  onClick={() => testApiCall("connection")}
                  disabled={isLoading}
                  className="h-auto p-4 flex flex-col items-start"
                >
                  <div className="font-medium">Test Connection</div>
                  <div className="text-sm opacity-70">Check API availability</div>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="order-id">Order ID</Label>
                  <Input
                    id="order-id"
                    placeholder="Enter order ID (e.g., 12345)"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => testApiCall("orders")}
                    disabled={isLoading}
                    className="h-auto p-4 flex flex-col items-start"
                  >
                    <div className="font-medium">Get All Orders</div>
                    <div className="text-sm opacity-70">Fetch recent orders</div>
                  </Button>

                  <Button
                    onClick={() => testApiCall("order", { id: orderId })}
                    disabled={isLoading || !orderId}
                    className="h-auto p-4 flex flex-col items-start"
                  >
                    <div className="font-medium">Get Order by ID</div>
                    <div className="text-sm opacity-70">Fetch specific order details</div>
                  </Button>

                  <Button
                    onClick={() => testApiCall("order-items", { id: orderId })}
                    disabled={isLoading || !orderId}
                    className="h-auto p-4 flex flex-col items-start"
                  >
                    <div className="font-medium">Get Order Items</div>
                    <div className="text-sm opacity-70">Fetch order services/items</div>
                  </Button>

                  <Button
                    onClick={() => testApiCall("orders-by-client", { clientId })}
                    disabled={isLoading || !clientId}
                    className="h-auto p-4 flex flex-col items-start"
                  >
                    <div className="font-medium">Orders by Client</div>
                    <div className="text-sm opacity-70">Fetch orders for specific client</div>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="clients" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    placeholder="Enter client ID (e.g., 67890)"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => testApiCall("clients")}
                    disabled={isLoading}
                    className="h-auto p-4 flex flex-col items-start"
                  >
                    <div className="font-medium">Get All Clients</div>
                    <div className="text-sm opacity-70">Fetch recent clients</div>
                  </Button>

                  <Button
                    onClick={() => testApiCall("client", { id: clientId })}
                    disabled={isLoading || !clientId}
                    className="h-auto p-4 flex flex-col items-start"
                  >
                    <div className="font-medium">Get Client by ID</div>
                    <div className="text-sm opacity-70">Fetch specific client details</div>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="statuses" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => testApiCall("order-statuses")}
                  disabled={isLoading}
                  className="h-auto p-4 flex flex-col items-start"
                >
                  <div className="font-medium">Get Order Statuses</div>
                  <div className="text-sm opacity-70">Fetch all available order statuses</div>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(testResult.success)}
              API Test Result
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? "Success" : "Failed"}
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {new Date(testResult.timestamp).toLocaleString()}
              {testResult.endpoint && (
                <>
                  <span>•</span>
                  <code className="text-xs">{testResult.endpoint}</code>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResult.error && (
                <div>
                  <Label>Error</Label>
                  <div className="bg-destructive/10 text-destructive p-3 rounded text-sm">{testResult.error}</div>
                </div>
              )}

              {testResult.data && (
                <>
                  <Separator />
                  <div>
                    <Label>Response Data</Label>
                    <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-96">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
