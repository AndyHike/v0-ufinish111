"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Copy, Send, Zap } from "lucide-react"
import { toast } from "sonner"

const WEBHOOK_URL = "https://devicehelp.cz/api/webhooks/remonline"

const SAMPLE_WEBHOOKS = {
  "Order.Created": {
    id: "webhook_123",
    created_at: new Date().toISOString(),
    event_name: "Order.Created",
    context: {
      object_id: 12345,
      object_type: "Order",
    },
    metadata: {
      order: {
        id: 12345,
        name: "ORD-2024-001",
        type: 1,
      },
      client: {
        id: 67890,
        fullname: "Іван Петренко",
      },
      asset: {
        id: 11111,
        name: "iPhone 13 Pro",
      },
    },
    employee: {
      id: 1,
      full_name: "Адміністратор",
      email: "admin@devicehelp.cz",
    },
  },
  "Order.StatusChanged": {
    id: "webhook_124",
    created_at: new Date().toISOString(),
    event_name: "Order.StatusChanged",
    context: {
      object_id: 12345,
      object_type: "Order",
    },
    metadata: {
      order: {
        id: 12345,
        name: "ORD-2024-001",
      },
      status: {
        id: 3,
      },
    },
    employee: {
      id: 1,
      full_name: "Адміністратор",
      email: "admin@devicehelp.cz",
    },
  },
  "Client.Created": {
    id: "webhook_125",
    created_at: new Date().toISOString(),
    event_name: "Client.Created",
    context: {
      object_id: 67890,
      object_type: "Client",
    },
    metadata: {
      client: {
        id: 67890,
        fullname: "Марія Коваленко",
      },
    },
    employee: {
      id: 1,
      full_name: "Адміністратор",
      email: "admin@devicehelp.cz",
    },
  },
}

export function WebhookTester() {
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [customPayload, setCustomPayload] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState<any>(null)

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(WEBHOOK_URL)
    toast.success("Webhook URL copied to clipboard")
  }

  const loadSamplePayload = (eventType: string) => {
    const sample = SAMPLE_WEBHOOKS[eventType as keyof typeof SAMPLE_WEBHOOKS]
    if (sample) {
      setCustomPayload(JSON.stringify(sample, null, 2))
    }
  }

  const sendTestWebhook = async () => {
    if (!customPayload.trim()) {
      toast.error("Please enter a webhook payload")
      return
    }

    try {
      setIsLoading(true)
      const payload = JSON.parse(customPayload)

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-remonline-signature": "test-signature",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      setLastResponse({
        status: response.status,
        statusText: response.statusText,
        data: result,
      })

      if (response.ok) {
        toast.success("Webhook sent successfully!")
      } else {
        toast.error(`Webhook failed: ${response.status}`)
      }
    } catch (error) {
      console.error("Error sending webhook:", error)
      toast.error("Failed to send webhook")
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
      {/* Webhook URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Webhook Endpoint</CardTitle>
          <CardDescription>Use this URL in your RemOnline webhook settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted p-2 rounded text-sm font-mono">{WEBHOOK_URL}</code>
            <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sample Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Test</CardTitle>
          <CardDescription>Select a sample event to test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {Object.keys(SAMPLE_WEBHOOKS).map((eventType) => (
                <Button
                  key={eventType}
                  variant="outline"
                  onClick={() => {
                    setSelectedEvent(eventType)
                    loadSamplePayload(eventType)
                  }}
                  className="justify-start"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {eventType}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Payload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custom Webhook Payload</CardTitle>
          <CardDescription>Edit the JSON payload and send a test webhook</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payload">JSON Payload</Label>
            <Textarea
              id="payload"
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              placeholder="Enter webhook JSON payload..."
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={sendTestWebhook} disabled={isLoading}>
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? "Sending..." : "Send Test Webhook"}
            </Button>
            <Button variant="outline" onClick={() => setCustomPayload("")} disabled={isLoading}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Response */}
      {lastResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Last Response
              <Badge variant={lastResponse.status === 200 ? "default" : "destructive"}>
                {lastResponse.status} {lastResponse.statusText}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {JSON.stringify(lastResponse.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
