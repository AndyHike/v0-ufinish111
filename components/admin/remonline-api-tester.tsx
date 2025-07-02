"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Database, User, Package, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function RemOnlineApiTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [entityType, setEntityType] = useState("orders")
  const [entityId, setEntityId] = useState("")

  const entityTypes = {
    orders: { label: "Orders", icon: Package, endpoint: "orders" },
    clients: { label: "Clients", icon: User, endpoint: "clients" },
    branches: { label: "Branches", icon: Database, endpoint: "branches" },
  }

  const testApiCall = async () => {
    if (!entityId.trim()) {
      toast.error("Please enter an ID to test")
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      console.log(`🧪 Testing RemOnline API: ${entityType}/${entityId}`)

      const response = await fetch(`/api/admin/test-remonline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: entityTypes[entityType as keyof typeof entityTypes].endpoint,
          id: entityId,
        }),
      })

      const result = await response.json()

      setTestResult({
        success: response.ok,
        status: response.status,
        data: result,
        timestamp: new Date().toISOString(),
      })

      if (response.ok) {
        toast.success("API test completed successfully!")
      } else {
        toast.error(`API test failed: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("API test error:", error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })
      toast.error("Failed to test API")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const selectedEntity = entityTypes[entityType as keyof typeof entityTypes]
  const IconComponent = selectedEntity.icon

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            RemOnline API Tester
          </CardTitle>
          <CardDescription>Test your RemOnline API connection by fetching data with specific IDs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entity-type">Entity Type</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(entityTypes).map(([key, entity]) => {
                    const Icon = entity.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {entity.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="entity-id">Entity ID</Label>
              <Input
                id="entity-id"
                placeholder="Enter ID (e.g., 12345)"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                type="number"
              />
            </div>
          </div>

          <Button onClick={testApiCall} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing API...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Test {selectedEntity.label} API
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* API Examples */}
      <Card>
        <CardHeader>
          <CardTitle>API Examples</CardTitle>
          <CardDescription>Common RemOnline API endpoints you can test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Orders</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Fetch order details by order ID</p>
              <Badge variant="outline" className="text-xs">
                GET /orders/{"{id}"}
              </Badge>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-green-500" />
                <span className="font-medium">Clients</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Fetch client information by client ID</p>
              <Badge variant="outline" className="text-xs">
                GET /clients/{"{id}"}
              </Badge>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Branches</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Fetch branch details by branch ID</p>
              <Badge variant="outline" className="text-xs">
                GET /branches/{"{id}"}
              </Badge>
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
              API Test Result
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? "Success" : "Failed"}
              </Badge>
            </CardTitle>
            <CardDescription>{new Date(testResult.timestamp).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResult.status && (
                <div>
                  <Label>HTTP Status</Label>
                  <Badge variant="outline" className="ml-2">
                    {testResult.status}
                  </Badge>
                </div>
              )}

              <Separator />

              <div>
                <Label>API Response</Label>
                <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-96 mt-2">
                  {JSON.stringify(testResult.data || testResult.error, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
