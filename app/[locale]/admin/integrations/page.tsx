import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WebhookMonitor } from "@/components/admin/webhook-monitor"
import { WebhookTester } from "@/components/admin/webhook-tester"
import { RemOnlineApiTester } from "@/components/admin/remonline-api-tester"
import { Activity, TestTube, Settings, Zap } from "lucide-react"

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">Monitor and test your RemOnline webhook integrations</p>
      </div>

      <Tabs defaultValue="monitor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test Webhooks
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Test API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-6">
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Zap className="h-5 w-5" />
                Real-time Webhook Monitor
              </CardTitle>
              <CardDescription className="text-blue-700">
                All incoming webhooks are captured and displayed here automatically. No configuration needed - just send
                webhooks to your endpoint.
              </CardDescription>
            </CardHeader>
          </Card>

          <Suspense fallback={<div>Loading webhook monitor...</div>}>
            <WebhookMonitor />
          </Suspense>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <TestTube className="h-5 w-5" />
                Webhook Testing
              </CardTitle>
              <CardDescription className="text-green-700">
                Send test webhooks to verify your endpoint is working correctly. All test webhooks will appear in the
                Monitor tab.
              </CardDescription>
            </CardHeader>
          </Card>

          <Suspense fallback={<div>Loading webhook tester...</div>}>
            <WebhookTester />
          </Suspense>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Settings className="h-5 w-5" />
                RemOnline API Testing
              </CardTitle>
              <CardDescription className="text-purple-700">
                Test your RemOnline API connection and fetch data by ID.
              </CardDescription>
            </CardHeader>
          </Card>

          <Suspense fallback={<div>Loading API tester...</div>}>
            <RemOnlineApiTester />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
