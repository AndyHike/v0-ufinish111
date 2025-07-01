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
  "event": "Order.Created",
  "context": {
    "object_id": 12345
  },
  "metadata": {
    "client": {
      "id": 67890
    }
  },
  "timestamp": "${new Date().toISOString()}"
}`)
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null)

  const sampleWebhooks = {
    orderCreated: {
      name: "Order Created",
      data: `{
  "event": "Order.Created",
  "context": {
    "object_id": 12345
  },
  "metadata": {
    "client": {
      "id": 67890
    }
  },
  "timestamp": "${new Date().toISOString()}"
}`,
    },
    orderUpdated: {
      name: "Order Updated",
      data: `{
  "event": "Order.Updated",
  "context": {
    "object_id": 12345
  },
  "metadata": {
    "client": {
      "id": 67890
    }
  },
  "timestamp": "${new Date().toISOString()}"
}`,
    },
    orderCompleted: {
      name: "Order Completed",
      data: `{
  "event": "Order.Completed",
  "context": {
    "object_id": 12345
  },
  "metadata": {
    "client": {
      "id": 67890
    }
  },
  "timestamp": "${new Date().toISOString()}"
}`,
    },
  }

  const runWebhookTest = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const parsedData = JSON.parse(webhookData)
      console.log("🧪 Testing webhook with data:", parsedData)

      const response = await fetch("/api/admin/test-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ webhookData: parsedData }),
      })

      const data = await response.json()
      console.log("🧪 Webhook test response:", data)

      setTestResult(data)

      if (data.success) {
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
              <strong>Webhook URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com"}
              /api/webhooks/remonline
            </div>
            <div className="text-xs text-blue-600 mt-1">Configure this URL in your RemOnline webhook settings</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
