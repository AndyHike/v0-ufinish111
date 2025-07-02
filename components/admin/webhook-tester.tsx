"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, Webhook, CheckCircle, XCircle, Copy, RotateCcw } from "lucide-react"
import { toast } from "sonner"

interface WebhookTestResult {
  success: boolean
  status: number
  response: string
  message: string
}

export function WebhookTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [webhookData, setWebhookData] = useState(`{
  "id": "webhook_${Date.now()}",
  "created_at": "${new Date().toISOString()}",
  "event_name": "Order.Created",
  "context": {
    "object_id": 12345,
    "object_type": "order"
  },
  "metadata": {
    "order": {
      "id": 12345,
      "name": "Repair iPhone 13",
      "type": 1
    },
    "client": {
      "id": 67890,
      "fullname": "John Doe"
    },
    "status": {
      "id": 1
    },
    "asset": {
      "id": 98765,
      "name": "iPhone 13"
    }
  },
  "employee": {
    "id": 1,
    "full_name": "Admin User",
    "email": "admin@devicehelp.cz"
  }
}`)
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null)

  const sampleWebhooks = {
    orderCreated: {
      name: "Order Created",
      data: `{
  "id": "webhook_${Date.now()}",
  "created_at": "${new Date().toISOString()}",
  "event_name": "Order.Created",
  "context": {
    "object_id": 12345,
    "object_type": "order"
  },
  "metadata": {
    "order": {
      "id": 12345,
      "name": "Repair iPhone 13",
      "type": 1
    },
    "client": {
      "id": 67890,
      "fullname": "John Doe"
    }
  },
  "employee": {
    "id": 1,
    "full_name": "Admin User",
    "email": "admin@devicehelp.cz"
  }
}`,
    },
    orderUpdated: {
      name: "Order Updated",
      data: `{
  "id": "webhook_${Date.now()}",
  "created_at": "${new Date().toISOString()}",
  "event_name": "Order.Updated",
  "context": {
    "object_id": 12345,
    "object_type": "order"
  },
  "metadata": {
    "order": {
      "id": 12345,
      "name": "Repair iPhone 13",
      "type": 1
    },
    "client": {
      "id": 67890,
      "fullname": "John Doe"
    },
    "status": {
      "id": 2
    }
  },
  "employee": {
    "id": 1,
    "full_name": "Admin User",
    "email": "admin@devicehelp.cz"
  }
}`,
    },
    orderCompleted: {
      name: "Order Completed",
      data: `{
  "id": "webhook_${Date.now()}",
  "created_at": "${new Date().toISOString()}",
  "event_name": "Order.Completed",
  "context": {
    "object_id": 12345,
    "object_type": "order"
  },
  "metadata": {
    "order": {
      "id": 12345,
      "name": "Repair iPhone 13",
      "type": 1
    },
    "client": {
      "id": 67890,
      "fullname": "John Doe"
    },
    "status": {
      "id": 3
    }
  },
  "employee": {
    "id": 1,
    "full_name": "Admin User",
    "email": "admin@devicehelp.cz"
  }
}`,
    },
  }

  const runWebhookTest = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const parsedData = JSON.parse(webhookData)
      console.log("🧪 Testing webhook with data:", parsedData)

      // Send directly to the webhook endpoint
      const response = await fetch("/api/webhooks/remonline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-remonline-signature": "test-signature", // Test signature
        },
        body: JSON.stringify(parsedData),
      })

      const responseText = await response.text()
      let responseData

      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = { message: responseText }
      }

      console.log("🧪 Webhook test response:", responseData)

      setTestResult({
        success: response.ok,
        status: response.status,
        response: JSON.stringify(responseData, null, 2),
        message: responseData.message || `HTTP ${response.status} ${response.statusText}`,
      })

      if (response.ok) {
        toast.success("Webhook test completed successfully")
      } else {
        toast.error("Webhook test failed")
      }
    } catch (error) {
      console.error("🧪 Webhook test error:", error)
      toast.error("Failed to run webhook test")
      setTestResult({
        success: false,
        status: 0,
        response: error instanceof Error ? error.message : String(error),
        message: "Failed to parse webhook data or network error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSampleWebhook = (sample: { name: string; data: string }) => {
    setWebhookData(sample.data)
    toast.success(`Loaded ${sample.name} sample`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const resetWebhookData = () => {
    setWebhookData(sampleWebhooks.orderCreated.data)
    setTestResult(null)
    toast.success("Reset to default webhook data")
  }

  // Get the correct webhook URL
  const webhookUrl = "https://devicehelp.cz/api/webhooks/remonline"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Tester
          </CardTitle>
          <CardDescription>
            Test your webhook endpoint by sending sample webhook data. This will simulate RemOnline sending a webhook to
            your application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample Webhooks */}
          <div>
            <label className="text-sm font-medium mb-2 block">Sample Webhooks:</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(sampleWebhooks).map(([key, sample]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => loadSampleWebhook(sample)}
                  className="text-xs"
                >
                  {sample.name}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={resetWebhookData} className="text-xs bg-transparent">
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          {/* Webhook Data Input */}
          <div>
            <label htmlFor="webhook-data" className="text-sm font-medium mb-2 block">
              Webhook Data (JSON):
            </label>
            <Textarea
              id="webhook-data"
              value={webhookData}
              onChange={(e) => setWebhookData(e.target.value)}
              placeholder="Enter webhook JSON data..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {/* Test Button */}
          <Button onClick={runWebhookTest} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Webhook...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Test Webhook
              </>
            )}
          </Button>

          {/* Test Results */}
          {testResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">Test Result: {testResult.success ? "Success" : "Failed"}</span>
                <Badge variant={testResult.success ? "default" : "destructive"}>Status: {testResult.status}</Badge>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Response:</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(testResult.response)}
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-64">{testResult.response}</pre>
              </div>

              <div className="text-sm text-muted-foreground">
                <strong>Message:</strong> {testResult.message}
              </div>
            </div>
          )}

          {/* Webhook URL Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Webhook URL:</strong> {webhookUrl}
            </div>
            <div className="text-xs text-blue-600 mt-1">Configure this URL in your RemOnline webhook settings</div>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(webhookUrl)} className="text-xs mt-2">
              <Copy className="h-3 w-3 mr-1" />
              Copy URL
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
