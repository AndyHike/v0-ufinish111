"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Send, TestTube, CheckCircle, XCircle, Clock, Zap, Settings, Code } from "lucide-react"
import { toast } from "sonner"

export function WebhookTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [customPayload, setCustomPayload] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("https://devicehelp.cz/api/webhooks/remonline")
  const [selectedSample, setSelectedSample] = useState("")

  const samplePayloads = {
    orderCreated: {
      name: "Order Created",
      description: "RemOnline order creation webhook",
      payload: {
        id: "webhook_" + Date.now(),
        created_at: new Date().toISOString(),
        event_name: "Order.Created",
        context: {
          object_id: 12345,
          object_type: "order",
        },
        metadata: {
          order: {
            id: 12345,
            name: "Ремонт iPhone 14 Pro",
            type: 1,
            status_id: 1,
            client_id: 67890,
            created_at: new Date().toISOString(),
            total_amount: 2500.0,
            currency: "CZK",
          },
          client: {
            id: 67890,
            fullname: "Іван Петренко",
            phone: "+420123456789",
            email: "ivan@example.com",
          },
          status: {
            id: 1,
            name: "Новий",
            color: "#007bff",
          },
        },
        employee: {
          id: 1,
          full_name: "Майстер Олександр",
          email: "master@devicehelp.cz",
        },
      },
    },
    orderUpdated: {
      name: "Order Updated",
      description: "Order status change webhook",
      payload: {
        id: "webhook_" + Date.now(),
        created_at: new Date().toISOString(),
        event_name: "Order.Updated",
        context: {
          object_id: 12345,
          object_type: "order",
        },
        metadata: {
          order: {
            id: 12345,
            name: "Ремонт iPhone 14 Pro",
            type: 1,
            status_id: 2,
            client_id: 67890,
            updated_at: new Date().toISOString(),
            total_amount: 2500.0,
            currency: "CZK",
          },
          client: {
            id: 67890,
            fullname: "Іван Петренко",
            phone: "+420123456789",
            email: "ivan@example.com",
          },
          status: {
            id: 2,
            name: "В роботі",
            color: "#ffc107",
          },
          previous_status: {
            id: 1,
            name: "Новий",
            color: "#007bff",
          },
        },
        employee: {
          id: 1,
          full_name: "Майстер Олександр",
          email: "master@devicehelp.cz",
        },
      },
    },
    clientCreated: {
      name: "Client Created",
      description: "New client registration webhook",
      payload: {
        id: "webhook_" + Date.now(),
        created_at: new Date().toISOString(),
        event_name: "Client.Created",
        context: {
          object_id: 67890,
          object_type: "client",
        },
        metadata: {
          client: {
            id: 67890,
            fullname: "Марія Коваленко",
            phone: "+420987654321",
            email: "maria@example.com",
            created_at: new Date().toISOString(),
            address: "Praha, Czech Republic",
            notes: "VIP клієнт",
          },
        },
        employee: {
          id: 1,
          full_name: "Майстер Олександр",
          email: "master@devicehelp.cz",
        },
      },
    },
    simpleTest: {
      name: "Simple Test",
      description: "Basic test payload",
      payload: {
        test: true,
        message: "This is a simple test webhook",
        timestamp: new Date().toISOString(),
        event_name: "Test.Simple",
        data: {
          some: "random",
          nested: {
            data: "structure",
            number: 42,
            boolean: true,
          },
        },
        metadata: {
          source: "webhook-tester",
          version: "1.0",
        },
      },
    },
  }

  const sendTestWebhook = async (payload: any) => {
    if (!webhookUrl.trim()) {
      toast.error("Please enter a webhook URL")
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      console.log("🧪 Sending test webhook to:", webhookUrl)
      console.log("📦 Payload:", payload)

      const startTime = Date.now()

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "WebhookTester/1.0 (DeviceHelp Admin Panel)",
          "X-Test-Source": "admin-panel",
          "X-Test-Timestamp": new Date().toISOString(),
        },
        body: JSON.stringify(payload),
      })

      const processingTime = Date.now() - startTime
      let responseData: any

      try {
        responseData = await response.json()
      } catch (e) {
        responseData = await response.text()
      }

      const result = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        processingTime,
        timestamp: new Date().toISOString(),
        headers: Object.fromEntries(response.headers.entries()),
      }

      setTestResult(result)

      if (response.ok) {
        toast.success(`Test webhook sent successfully! (${processingTime}ms)`)
        console.log("✅ Webhook sent successfully:", result)
      } else {
        toast.error(`Test webhook failed: ${response.status} ${response.statusText}`)
        console.error("❌ Webhook failed:", result)
      }
    } catch (error) {
      console.error("💥 Test webhook error:", error)
      const result = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        processingTime: 0,
      }
      setTestResult(result)
      toast.error(`Failed to send webhook: ${result.error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const sendCustomWebhook = async () => {
    if (!customPayload.trim()) {
      toast.error("Please enter a custom payload")
      return
    }

    try {
      const payload = JSON.parse(customPayload)
      await sendTestWebhook(payload)
    } catch (error) {
      toast.error("Invalid JSON payload")
      console.error("JSON parse error:", error)
    }
  }

  const testEndpointConnection = async () => {
    if (!webhookUrl.trim()) {
      toast.error("Please enter a webhook URL")
      return
    }

    setIsLoading(true)
    try {
      console.log("🔍 Testing endpoint connection:", webhookUrl)

      const response = await fetch(webhookUrl, {
        method: "GET",
        headers: {
          "User-Agent": "WebhookTester/1.0 (Connection Test)",
        },
      })

      let responseData: any
      try {
        responseData = await response.json()
      } catch (e) {
        responseData = await response.text()
      }

      const result = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        timestamp: new Date().toISOString(),
        headers: Object.fromEntries(response.headers.entries()),
      }

      setTestResult(result)

      if (response.ok) {
        toast.success("Endpoint is active and responding!")
        console.log("✅ Endpoint test successful:", result)
      } else {
        toast.error(`Endpoint test failed: ${response.status} ${response.statusText}`)
        console.error("❌ Endpoint test failed:", result)
      }
    } catch (error) {
      console.error("💥 Connection test error:", error)
      const result = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }
      setTestResult(result)
      toast.error(`Connection failed: ${result.error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    toast.success("Webhook URL copied to clipboard")
  }

  const loadSamplePayload = (key: string) => {
    const sample = samplePayloads[key as keyof typeof samplePayloads]
    if (sample) {
      setCustomPayload(JSON.stringify(sample.payload, null, 2))
      setSelectedSample(key)
      toast.success(`Loaded ${sample.name} payload`)
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

  return (
    <div className="space-y-6">
      {/* Webhook URL Configuration */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Settings className="h-5 w-5" />
            Webhook Endpoint Configuration
          </CardTitle>
          <CardDescription className="text-blue-700">Configure the webhook endpoint URL for testing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="webhook-url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-domain.com/api/webhooks/endpoint"
                  className="font-mono bg-white"
                />
                <Button variant="outline" onClick={copyWebhookUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={testEndpointConnection} disabled={isLoading}>
                <Zap className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
              <Badge variant="secondary" className="text-blue-700">
                Accepts POST requests with JSON payload
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Sample Webhook Tests
          </CardTitle>
          <CardDescription>Send predefined webhook events to test your integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(samplePayloads).map(([key, sample]) => (
              <Button
                key={key}
                variant="outline"
                onClick={() => sendTestWebhook(sample.payload)}
                disabled={isLoading}
                className="h-auto p-4 flex flex-col items-start text-left"
              >
                <div className="font-medium">{sample.name}</div>
                <div className="text-sm text-muted-foreground">{sample.description}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Custom Webhook Payload
          </CardTitle>
          <CardDescription>Create and send custom JSON payloads for testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Label className="text-sm font-medium">Quick Load:</Label>
            {Object.entries(samplePayloads).map(([key, sample]) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => loadSamplePayload(key)}
                className={selectedSample === key ? "bg-blue-100" : ""}
              >
                {sample.name}
              </Button>
            ))}
          </div>

          <div>
            <Label htmlFor="custom-payload">JSON Payload</Label>
            <Textarea
              id="custom-payload"
              placeholder='{"event_name": "Custom.Test", "data": {"your": "custom", "webhook": "data"}}'
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={sendCustomWebhook} disabled={isLoading || !customPayload.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Send Custom Webhook
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCustomPayload("")
                setSelectedSample("")
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(testResult.success)}
              Test Result
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? "Success" : "Failed"}
              </Badge>
              {testResult.status && (
                <Badge variant="outline">
                  {testResult.status} {testResult.statusText}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {new Date(testResult.timestamp).toLocaleString()}
              {testResult.processingTime && <span className="ml-2">({testResult.processingTime}ms)</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="response" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="response">Response</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="response" className="mt-4">
                <div>
                  <Label>Response Body</Label>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-64 mt-2">
                    {formatJson(testResult.data || testResult.error)}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="headers" className="mt-4">
                <div>
                  <Label>Response Headers</Label>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-64 mt-2">
                    {formatJson(testResult.headers || {})}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label>Request Details</Label>
                    <div className="bg-muted p-3 rounded text-sm mt-2">
                      <p>
                        <strong>URL:</strong> {webhookUrl}
                      </p>
                      <p>
                        <strong>Method:</strong> POST
                      </p>
                      <p>
                        <strong>Content-Type:</strong> application/json
                      </p>
                      <p>
                        <strong>Status:</strong> {testResult.status} {testResult.statusText}
                      </p>
                      <p>
                        <strong>Success:</strong> {testResult.success ? "Yes" : "No"}
                      </p>
                      {testResult.processingTime && (
                        <p>
                          <strong>Processing Time:</strong> {testResult.processingTime}ms
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 text-sm text-blue-600 bg-blue-50 p-3 rounded">
              💡 Check the "Monitor" tab to see this webhook appear in real-time logs!
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
