"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Send, CheckCircle, XCircle, Globe } from "lucide-react"

interface TestResult {
  success: boolean
  status: number
  response: any
  headers: Record<string, string>
  timing: number
  error?: string
}

export function WebhookTester() {
  const [endpointUrl, setEndpointUrl] = useState("https://devicehelp.cz/api/webhooks/remonline")
  const [customPayload, setCustomPayload] = useState("")
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const samplePayloads = {
    order_created: {
      event: "order.created",
      data: {
        id: 12345,
        document_id: "ORD-2024-001",
        client_id: 67890,
        status: "new",
        total_amount: 150.0,
        created_at: "2024-01-15T10:30:00Z",
        device: {
          brand: "Apple",
          model: "iPhone 14",
          serial: "ABC123456789",
        },
        services: [
          {
            id: 1,
            name: "Screen Replacement",
            price: 120.0,
            warranty_period: 90,
            warranty_units: "days",
          },
          {
            id: 2,
            name: "Diagnostic",
            price: 30.0,
            warranty_period: 0,
            warranty_units: "days",
          },
        ],
      },
    },
    order_updated: {
      event: "order.updated",
      data: {
        id: 12345,
        document_id: "ORD-2024-001",
        status: "in_progress",
        updated_at: "2024-01-15T14:30:00Z",
        changes: {
          status: {
            from: "new",
            to: "in_progress",
          },
        },
      },
    },
    client_created: {
      event: "client.created",
      data: {
        id: 67890,
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        phone: ["+420123456789"],
        created_at: "2024-01-15T09:00:00Z",
      },
    },
  }

  const testConnection = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const startTime = Date.now()
      const response = await fetch(endpointUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "WebhookTester/1.0",
        },
      })

      const timing = Date.now() - startTime
      const responseData = await response.json()
      const headers = Object.fromEntries(response.headers.entries())

      setTestResult({
        success: response.ok,
        status: response.status,
        response: responseData,
        headers,
        timing,
      })
    } catch (error) {
      setTestResult({
        success: false,
        status: 0,
        response: null,
        headers: {},
        timing: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendWebhook = async (payload: any) => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const startTime = Date.now()
      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "RemOnline-Webhook/1.0",
          "X-RemOnline-Event": payload.event || "test.webhook",
        },
        body: JSON.stringify(payload),
      })

      const timing = Date.now() - startTime
      const responseData = await response.json()
      const headers = Object.fromEntries(response.headers.entries())

      setTestResult({
        success: response.ok,
        status: response.status,
        response: responseData,
        headers,
        timing,
      })
    } catch (error) {
      setTestResult({
        success: false,
        status: 0,
        response: null,
        headers: {},
        timing: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendCustomWebhook = async () => {
    try {
      const payload = JSON.parse(customPayload)
      await sendWebhook(payload)
    } catch (error) {
      setTestResult({
        success: false,
        status: 0,
        response: null,
        headers: {},
        timing: 0,
        error: "Invalid JSON payload",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Webhook Tester
          </CardTitle>
          <CardDescription>Test webhook endpoints and send sample payloads</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="endpoint">Webhook Endpoint URL</Label>
            <div className="flex gap-2">
              <Input
                id="endpoint"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://your-domain.com/api/webhooks/remonline"
                className="flex-1"
              />
              <Button
                onClick={testConnection}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Test Connection
              </Button>
            </div>
          </div>

          {testResult && (
            <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={testResult.success ? "default" : "destructive"}>
                        {testResult.status || "ERROR"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{testResult.timing}ms</span>
                    </div>
                    {testResult.error && <p className="text-sm text-red-600">{testResult.error}</p>}
                    {testResult.response && (
                      <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto max-h-32">
                        {JSON.stringify(testResult.response, null, 2)}
                      </pre>
                    )}
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="samples" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="samples">Sample Webhooks</TabsTrigger>
          <TabsTrigger value="custom">Custom Payload</TabsTrigger>
        </TabsList>

        <TabsContent value="samples" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(samplePayloads).map(([key, payload]) => (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{key.replace("_", " ").toUpperCase()}</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => sendWebhook(payload)}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      Send
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Custom JSON Payload</CardTitle>
              <CardDescription>Enter your own JSON payload to test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                placeholder='{"event": "test", "data": {"message": "Hello World"}}'
                className="min-h-[200px] font-mono text-sm"
              />
              <Button
                onClick={sendCustomWebhook}
                disabled={isLoading || !customPayload.trim()}
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Custom Webhook
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
