import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

// Import all admin components
import { RegistrationToggle } from "@/components/admin/registration-toggle"
import { MaintenanceModeToggle } from "@/components/admin/maintenance-mode-toggle"
import { InfoBannerManager } from "@/components/admin/info-banner-manager"
import { LogoUpload } from "@/components/admin/logo-upload"
import { FaviconUpload } from "@/components/admin/favicon-upload"
import { CookieSettingsManager } from "@/components/admin/cookie-settings-manager"
import { PrivacyPolicyManager } from "@/components/admin/privacy-policy-manager"
import { TermsOfServiceManager } from "@/components/admin/terms-of-service-manager"
import { FacebookPixelTest } from "@/components/admin/facebook-pixel-test"
import { RemOnlineTest } from "@/components/admin/remonline-test"

export default async function AdminSettingsPage() {
  const t = await getTranslations("admin")

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.description")}</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6">
            <Suspense fallback={<Skeleton className="h-32" />}>
              <RegistrationToggle />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-32" />}>
              <MaintenanceModeToggle />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-48" />}>
              <InfoBannerManager />
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
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>Manage your website content and messaging</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Content management features will be added here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-6">
          <div className="grid gap-6">
            <Suspense fallback={<Skeleton className="h-48" />}>
              <CookieSettingsManager />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-48" />}>
              <PrivacyPolicyManager />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-48" />}>
              <TermsOfServiceManager />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <Suspense fallback={<Skeleton className="h-48" />}>
              <FacebookPixelTest />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6">
            <Suspense fallback={<Skeleton className="h-48" />}>
              <RemOnlineTest />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
