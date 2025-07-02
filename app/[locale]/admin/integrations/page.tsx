import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WebhookMonitor } from "@/components/admin/webhook-monitor"
import { WebhookTester } from "@/components/admin/webhook-tester"
import { RemOnlineApiTester } from "@/components/admin/remonline-api-tester"
import { Activity, TestTube, Settings } from "lucide-react"

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">RemOnline Integration</h1>
        <p className="text-muted-foreground">Monitor webhooks, test API endpoints, and manage RemOnline integration</p>
      </div>

      <Tabs defaultValue="monitor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Webhook Monitor
          </TabsTrigger>
          <TabsTrigger value="test-webhook" className="flex items-center gap-2">
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

        <TabsContent value="test-webhook">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Testing</CardTitle>
              <CardDescription>Test webhook endpoints and simulate RemOnline webhook events</CardDescription>
            </CardHeader>
            <CardContent>
              <WebhookTester />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test-api">
          <Card>
            <CardHeader>
              <CardTitle>RemOnline API Testing</CardTitle>
              <CardDescription>Test RemOnline API endpoints by entering order IDs, client IDs, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <RemOnlineApiTester />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
