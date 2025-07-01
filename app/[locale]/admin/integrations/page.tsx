import { Suspense } from "react"
import { getCurrentUser } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { RemOnlineTest } from "@/components/admin/remonline-test"
import { WebhookTester } from "@/components/admin/webhook-tester"
import { RemOnlineApiTester } from "@/components/admin/remonline-api-tester"

export default async function AdminIntegrationsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations & Testing</h1>
        <p className="text-muted-foreground">
          Test and debug your RemOnline API integration and webhook functionality.
        </p>
      </div>

      <Tabs defaultValue="api-test" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-test">API Testing</TabsTrigger>
          <TabsTrigger value="webhook-test">Webhook Testing</TabsTrigger>
          <TabsTrigger value="connection-test">Connection Test</TabsTrigger>
        </TabsList>

        <TabsContent value="api-test" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <RemOnlineApiTester />
          </Suspense>
        </TabsContent>

        <TabsContent value="webhook-test" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <WebhookTester />
          </Suspense>
        </TabsContent>

        <TabsContent value="connection-test" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-48" />}>
            <RemOnlineTest />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
