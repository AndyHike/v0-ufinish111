"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Copy, Send, TestTube, CheckCircle, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"

export function WebhookTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [customPayload, setCustomPayload] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("https://devicehelp.cz/api/webhooks/remonline")

  const samplePayloads = {
    orderCreated: {
      id: "webhook_123",
      created_at: "2024-01-15T10:30:00Z",
      event_name: "Order.Created",
      context: {
        object_id: 12345,
        object_type: "order",
      },
      metadata: {
        order: {
          id: 12345,
          name: "Ремонт iPhone 14",
          type: 1,
        },
        client: {
          id: 67890,
          fullname: "Іван Петренко",
        },
        status: {
          id: 1,
        },
      },
      employee: {
        id: 1,
        full_name: "Майстер Олександр",
        email: "master@devicehelp.cz",
      },
    },
    orderUpdated: {
      id: "webhook_124",
      created_at: "2024-01-15T11:30:00Z",
      event_name: "Order.Updated",
      context: {
        object_id: 12345,
        object_type: "order",
      },
      metadata: {
        order: {
          id: 12345,
          name: "Ремонт iPhone 14",
          type: 1,
        },
        client: {
          id: 67890,
          fullname: "Іван Петренко",
        },
        status: {
          id: 2,
        },
      },
      employee: {
        id: 1,
        full_name: "Майстер Олександр",
        email: "master@devicehelp.cz",
      },
    },
    clientCreated: {
      id: "webhook_125",
      created_at: "2024-01-15T09:15:00Z",
      event_name: "Client.Created",
      context: {
        object_id: 67890,
        object_type: "client",
      },
      metadata: {
        client: {
          id: 67890,
          fullname: "Марія Коваленко",
        },
      },
      employee: {
        id: 1,
        full_name: "Майстер Олександр",
        email: "master@devicehelp.cz",
      },
    },
  }

  const sendTestWebhook = async (payload: any) => {
    setIsLoading(true)
    setTestResult(null)

    try {
      console.log("🧪 Sending test webhook:", payload)

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-remonline-signature": "test-signature",
          "User-Agent": "RemOnline-Webhook/1.0",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      setTestResult({
        success: response.ok,
        status: response.status,
        data: result,
        timestamp: new Date().toISOString(),
      })

      if (response.ok) {
        toast.success("Test webhook sent successfully!")
      } else {
        toast.error(`Test webhook failed: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Test webhook error:", error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })
      toast.error("Failed to send test webhook")
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
    }
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    toast.success("Webhook URL copied to clipboard")
  }

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      {/* Webhook URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Webhook Endpoint
          </CardTitle>
          <CardDescription>Use this URL in your RemOnline webhook settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="font-mono" />
            <Button variant="outline" onClick={copyWebhookUrl}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Configure this URL in RemOnline → Settings → Webhooks</p>
        </CardContent>
      </Card>

      {/* Sample Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Test Sample Webhooks</CardTitle>
          <CardDescription>Send sample webhook events to test your integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => sendTestWebhook(samplePayloads.orderCreated)}
              disabled={isLoading}
              className="h-auto p-4 flex flex-col items-start"
            >
              <div className="font-medium">Order Created</div>
              <div className="text-sm text-muted-foreground">Test order creation webhook</div>
            </Button>

            <Button
              variant="outline"
              onClick={() => sendTestWebhook(samplePayloads.orderUpdated)}
              disabled={isLoading}
              className="h-auto p-4 flex flex-col items-start"
            >
              <div className="font-medium">Order Updated</div>
              <div className="text-sm text-muted-foreground">Test order update webhook</div>
            </Button>

            <Button
              variant="outline"
              onClick={() => sendTestWebhook(samplePayloads.clientCreated)}
              disabled={isLoading}
              className="h-auto p-4 flex flex-col items-start"
            >
              <div className="font-medium">Client Created</div>
              <div className="text-sm text-muted-foreground">Test client creation webhook</div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Webhook</CardTitle>
          <CardDescription>Send a custom webhook payload for testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="custom-payload">JSON Payload</Label>
            <Textarea
              id="custom-payload"
              placeholder="Enter your custom webhook JSON payload here..."
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              className="min-h-[200px] font-mono"
            />
          </div>
          <Button onClick={sendCustomWebhook} disabled={isLoading}>
            <Send className="h-4 w-4 mr-2" />
            Send Custom Webhook
          </Button>
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
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {new Date(testResult.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResult.status && (
                <div>
                  <Label>HTTP Status</Label>
                  <Badge variant="outline">{testResult.status}</Badge>
                </div>
              )}

              <Separator />

              <div>
                <Label>Response</Label>
                <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-64">
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
