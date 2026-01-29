import { Suspense } from "react"
import { getCurrentUser } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { CookieSettingsManager } from "@/components/admin/cookie-settings-manager"
import { FacebookPixelTest } from "@/components/admin/facebook-pixel-test"
import { RemOnlineTest } from "@/components/admin/remonline-test"
import { MaintenanceModeToggle } from "@/components/admin/maintenance-mode-toggle"
import { PrivacyPolicyManager } from "@/components/admin/privacy-policy-manager"
import { TermsOfServiceManager } from "@/components/admin/terms-of-service-manager"
import { RegistrationToggle } from "@/components/admin/registration-toggle"
import { LogoUpload } from "@/components/admin/logo-upload"
import { FaviconUpload } from "@/components/admin/favicon-upload"
import { InfoBannerManager } from "@/components/admin/info-banner-manager"
import { LanguageSelector } from "@/components/admin/language-selector"
import { CacheManagementPanel } from "@/components/admin/cache-management-panel"

export default async function AdminSettingsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings and configuration.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="cookies">Cookies & Analytics</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6">
            <Suspense fallback={<Skeleton className="h-32" />}>
              <LanguageSelector />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-32" />}>
              <RegistrationToggle />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <div className="grid gap-6">
            <Suspense fallback={<Skeleton className="h-48" />}>
              <LogoUpload />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-48" />}>
              <FaviconUpload />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-48" />}>
              <InfoBannerManager />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="cookies" className="space-y-6">
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            }
          >
            <CookieSettingsManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="legal" className="space-y-6">
          <div className="grid gap-6">
            <Suspense fallback={<Skeleton className="h-48" />}>
              <PrivacyPolicyManager />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-48" />}>
              <TermsOfServiceManager />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-32" />}>
            <MaintenanceModeToggle />
          </Suspense>
        </TabsContent>

        <TabsContent value="cache" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <CacheManagementPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6">
            <Suspense fallback={<Skeleton className="h-48" />}>
              <RemOnlineTest />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-48" />}>
              <FacebookPixelTest />
            </Suspense>

            <Card>
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
                <CardDescription>Additional debugging tools and information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Environment:</strong> {process.env.NODE_ENV}
                  </p>
                  <p>
                    <strong>Domain:</strong> {process.env.NEXT_PUBLIC_APP_URL}
                  </p>
                  <p>
                    <strong>RemOnline API:</strong>{" "}
                    {process.env.REMONLINE_API_KEY ? "✅ Configured" : "❌ Not configured"}
                  </p>
                  <p>
                    <strong>Build Time:</strong> {new Date().toISOString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
