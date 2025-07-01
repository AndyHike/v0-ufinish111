"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Database, Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface ApiTestResult {
  timestamp: string
  tests: {
    getAllOrders?: {
      success: boolean
      message: string
      count: number
      total: number
      sampleOrder: any
    }
    getOrderById?: {
      success: boolean
      message: string
      order: any
    }
    getOrderItems?: {
      success: boolean
      message: string
      items: any[]
      count: number
    }
    getOrdersByClientId?: {
      success: boolean
      message: string
      count: number
      total: number
      orders: any[]
    }
    getClients?: {
      success: boolean
      message: string
      count: number
      total: number
      sampleClient: any
    }
    getOrderStatuses?: {
      success: boolean
      message: string
      count: number
      statuses: any[]
    }
  }
}

export function RemOnlineApiTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [clientId, setClientId] = useState("")
  const [page, setPage] = useState("1")
  const [limit, setLimit] = useState("10")
  const [testResult, setTestResult] = useState<ApiTestResult | null>(null)

  const runApiTests = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const params = new URLSearchParams({
        page,
        limit,
      })

      if (orderId) params.append("orderId", orderId)
      if (clientId) params.append("clientId", clientId)

      console.log("🧪 Running RemOnline API tests with params:", { orderId, clientId, page, limit })

      const response = await fetch(`/api/admin/test-remonline-orders?${params}`)
      const data = await response.json()

      console.log("🧪 API test response:", data)

      if (response.ok) {
        setTestResult(data)
        toast.success("API tests completed")
      } else {
        toast.error(`API tests failed: ${data.error}`)
        setTestResult({
          timestamp: new Date().toISOString(),
          tests: {
            getAllOrders: {
              success: false,
              message: data.error || "Unknown error",
              count: 0,
              total: 0,
              sampleOrder: null,
            },
          },
        })
      }
    } catch (error) {
      console.error("🧪 API test error:", error)
      toast.error("Failed to run API tests")
      setTestResult({
        timestamp: new Date().toISOString(),
        tests: {
          getAllOrders: {
            success: false,
            message: error instanceof Error ? error.message : String(error),
            count: 0,
            total: 0,
            sampleOrder: null,
          },
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2))
    toast.success("Copied to clipboard")
  }

  const resetForm = () => {
    setOrderId("")
    setClientId("")
    setPage("1")
    setLimit("10")
    setTestResult(null)
    toast.success("Form reset")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            RemOnline API Tester
          </CardTitle>
          <CardDescription>
            Test various RemOnline API endpoints to verify connectivity and data retrieval. This will help diagnose
            issues with order and client data fetching.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="order-id">Order ID (optional)</Label>
              <Input
                id="order-id"
                type="number"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. 12345"
              />
            </div>
            <div>
              <Label htmlFor="client-id">Client ID (optional)</Label>
              <Input
                id="client-id"
                type="number"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g. 67890"
              />
            </div>
            <div>
              <Label htmlFor="page">Page</Label>
              <Input
                id="page"
                type="number"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                placeholder="1"
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="limit">Limit</Label>
              <Input
                id="limit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="10"
                min="1"
                max="100"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={runApiTests} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Run API Tests
                </>
              )}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Test Results</h3>
                <div className="text-sm text-muted-foreground">
                  Tested at: {new Date(testResult.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="grid gap-4">
                {/* Get All Orders */}
                {testResult.tests.getAllOrders && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Get All Orders</CardTitle>
                        <Badge variant={testResult.tests.getAllOrders.success ? "default" : "destructive"}>
                          {testResult.tests.getAllOrders.success ? "Success" : "Failed"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm space-y-2">
                        <div>
                          <strong>Message:</strong> {testResult.tests.getAllOrders.message}
                        </div>
                        <div>
                          <strong>Count:</strong> {testResult.tests.getAllOrders.count} /{" "}
                          {testResult.tests.getAllOrders.total}
                        </div>
                        {testResult.tests.getAllOrders.sampleOrder && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <strong>Sample Order:</strong>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(testResult.tests.getAllOrders!.sampleOrder)}
                                className="text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(testResult.tests.getAllOrders.sampleOrder, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Get Order By ID */}
                {testResult.tests.getOrderById && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Get Order By ID</CardTitle>
                        <Badge variant={testResult.tests.getOrderById.success ? "default" : "destructive"}>
                          {testResult.tests.getOrderById.success ? "Success" : "Failed"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm space-y-2">
                        <div>
                          <strong>Message:</strong> {testResult.tests.getOrderById.message}
                        </div>
                        {testResult.tests.getOrderById.order && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <strong>Order Data:</strong>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(testResult.tests.getOrderById!.order)}
                                className="text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(testResult.tests.getOrderById.order, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Get Order Items */}
                {testResult.tests.getOrderItems && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Get Order Items</CardTitle>
                        <Badge variant={testResult.tests.getOrderItems.success ? "default" : "destructive"}>
                          {testResult.tests.getOrderItems.success ? "Success" : "Failed"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm space-y-2">
                        <div>
                          <strong>Message:</strong> {testResult.tests.getOrderItems.message}
                        </div>
                        <div>
                          <strong>Items Count:</strong> {testResult.tests.getOrderItems.count}
                        </div>
                        {testResult.tests.getOrderItems.items.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <strong>Items:</strong>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(testResult.tests.getOrderItems!.items)}
                                className="text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(testResult.tests.getOrderItems.items, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Get Orders By Client ID */}
                {testResult.tests.getOrdersByClientId && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Get Orders By Client ID</CardTitle>
                        <Badge variant={testResult.tests.getOrdersByClientId.success ? "default" : "destructive"}>
                          {testResult.tests.getOrdersByClientId.success ? "Success" : "Failed"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm space-y-2">
                        <div>
                          <strong>Message:</strong> {testResult.tests.getOrdersByClientId.message}
                        </div>
                        <div>
                          <strong>Count:</strong> {testResult.tests.getOrdersByClientId.count} /{" "}
                          {testResult.tests.getOrdersByClientId.total}
                        </div>
                        {testResult.tests.getOrdersByClientId.orders.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <strong>Orders:</strong>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(testResult.tests.getOrdersByClientId!.orders)}
                                className="text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(testResult.tests.getOrdersByClientId.orders, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Get Clients */}
                {testResult.tests.getClients && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Get Clients</CardTitle>
                        <Badge variant={testResult.tests.getClients.success ? "default" : "destructive"}>
                          {testResult.tests.getClients.success ? "Success" : "Failed"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm space-y-2">
                        <div>
                          <strong>Message:</strong> {testResult.tests.getClients.message}
                        </div>
                        <div>
                          <strong>Count:</strong> {testResult.tests.getClients.count} /{" "}
                          {testResult.tests.getClients.total}
                        </div>
                        {testResult.tests.getClients.sampleClient && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <strong>Sample Client:</strong>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(testResult.tests.getClients!.sampleClient)}
                                className="text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(testResult.tests.getClients.sampleClient, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Get Order Statuses */}
                {testResult.tests.getOrderStatuses && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Get Order Statuses</CardTitle>
                        <Badge variant={testResult.tests.getOrderStatuses.success ? "default" : "destructive"}>
                          {testResult.tests.getOrderStatuses.success ? "Success" : "Failed"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm space-y-2">
                        <div>
                          <strong>Message:</strong> {testResult.tests.getOrderStatuses.message}
                        </div>
                        <div>
                          <strong>Count:</strong> {testResult.tests.getOrderStatuses.count}
                        </div>
                        {testResult.tests.getOrderStatuses.statuses.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <strong>Statuses:</strong>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(testResult.tests.getOrderStatuses!.statuses)}
                                className="text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(testResult.tests.getOrderStatuses.statuses, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
