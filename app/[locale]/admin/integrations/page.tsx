import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WebhookMonitor } from "@/components/admin/webhook-monitor"
import { WebhookTester } from "@/components/admin/webhook-tester"
import { RemonlineApiTester } from "@/components/admin/remonline-api-tester"
import { Activity, TestTube, Settings } from "lucide-react"

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">Manage RemOnline API integration and webhook monitoring</p>
      </div>

      <Tabs defaultValue="monitor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Webhook Monitor
          </TabsTrigger>
          <TabsTrigger value="test-webhooks" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test Webhooks
          </TabsTrigger>
          <TabsTrigger value="test-api" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Test API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor">
          <Suspense fallback={<div>Loading webhook monitor...</div>}>
            <WebhookMonitor />
          </Suspense>
        </TabsContent>

        <TabsContent value="test-webhooks">
          <WebhookTester />
        </TabsContent>

        <TabsContent value="test-api">
          <Suspense fallback={<div>Loading API tester...</div>}>
            <RemonlineApiTester />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Information</CardTitle>
          <CardDescription>Important information about RemOnline integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Webhook URL</h4>
            <code className="bg-muted px-2 py-1 rounded text-sm">https://devicehelp.cz/api/webhooks/remonline</code>
          </div>

          <div>
            <h4 className="font-medium">Supported Events</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Order.Created - When a new order is created</li>
              <li>Order.Updated - When an order is updated</li>
              <li>Order.StatusChanged - When order status changes</li>
              <li>Client.Created - When a new client is created</li>
              <li>Client.Updated - When client information is updated</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium">Environment Variables</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>REMONLINE_API_KEY - Your RemOnline API key</li>
              <li>REMONLINE_ORDER_WEBHOOK_SECRET - Webhook secret for validation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
