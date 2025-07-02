"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Database, Users, Package } from "lucide-react"
import { toast } from "sonner"

interface ApiResponse {
  status: number
  statusText: string
  data: any
}

export function RemOnlineApiTester() {
  const [orderId, setOrderId] = useState("")
  const [clientId, setClientId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState<ApiResponse | null>(null)

  const testOrderApi = async () => {
    if (!orderId.trim()) {
      toast.error("Please enter an Order ID")
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/test-remonline-orders?orderId=${orderId}`)
      const result = await response.json()

      setLastResponse({
        status: response.status,
        statusText: response.statusText,
        data: result,
      })

      if (response.ok) {
        toast.success("Order API test completed")
      } else {
        toast.error(`API test failed: ${response.status}`)
      }
    } catch (error) {
      console.error("Error testing order API:", error)
      toast.error("Failed to test order API")
      setLastResponse({
        status: 0,
        statusText: "Error",
        data: { error: error instanceof Error ? error.message : String(error) },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testClientApi = async () => {
    if (!clientId.trim()) {
      toast.error("Please enter a Client ID")
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/test-remonline?type=client&id=${clientId}`)
      const result = await response.json()

      setLastResponse({
        status: response.status,
        statusText: response.statusText,
        data: result,
      })

      if (response.ok) {
        toast.success("Client API test completed")
      } else {
        toast.error(`API test failed: ${response.status}`)
      }
    } catch (error) {
      console.error("Error testing client API:", error)
      toast.error("Failed to test client API")
      setLastResponse({
        status: 0,
        statusText: "Error",
        data: { error: error instanceof Error ? error.message : String(error) },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/test-remonline")
      const result = await response.json()

      setLastResponse({
        status: response.status,
        statusText: response.statusText,
        data: result,
      })

      if (response.ok) {
        toast.success("Connection test completed")
      } else {
        toast.error(`Connection test failed: ${response.status}`)
      }
    } catch (error) {
      console.error("Error testing connection:", error)
      toast.error("Failed to test connection")
      setLastResponse({
        status: 0,
        statusText: "Error",
        data: { error: error instanceof Error ? error.message : String(error) },
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Test RemOnline Connection
              </CardTitle>
              <CardDescription>Test basic connectivity to RemOnline API</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testConnection} disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "Testing..." : "Test Connection"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Test Order API
              </CardTitle>
              <CardDescription>Enter an order ID to fetch order details from RemOnline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">Order ID</Label>
                <Input
                  id="orderId"
                  type="number"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter RemOnline Order ID (e.g., 12345)"
                />
              </div>
              <Button onClick={testOrderApi} disabled={isLoading || !orderId.trim()}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "Testing..." : "Test Order API"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Test Client API
              </CardTitle>
              <CardDescription>Enter a client ID to fetch client details from RemOnline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  type="number"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter RemOnline Client ID (e.g., 67890)"
                />
              </div>
              <Button onClick={testClientApi} disabled={isLoading || !clientId.trim()}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "Testing..." : "Test Client API"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Response */}
      {lastResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              API Response
              <Badge variant={lastResponse.status === 200 ? "default" : "destructive"}>
                {lastResponse.status} {lastResponse.statusText}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(lastResponse.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
