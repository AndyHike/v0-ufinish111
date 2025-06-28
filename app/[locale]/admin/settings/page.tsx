import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Metadata } from "next"
import { RegistrationToggle } from "@/components/admin/registration-toggle"
import { LanguageSelector } from "@/components/admin/language-selector"
import { LogoUpload } from "@/components/admin/logo-upload"
import { FaviconUpload } from "@/components/admin/favicon-upload"
import { PrivacyPolicyManager } from "@/components/admin/privacy-policy-manager"
import { TermsOfServiceManager } from "@/components/admin/terms-of-service-manager"
import { CookieSettingsManager } from "@/components/admin/cookie-settings-manager"
import { MaintenanceModeToggle } from "@/components/admin/maintenance-mode-toggle"

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Admin" })
  return {
    title: t("settings"),
  }
}

export default async function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="cookies">Cookies & Analytics</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LanguageSelector />
            <div className="space-y-4">
              <LogoUpload />
              <FaviconUpload />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and access settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RegistrationToggle />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="space-y-6">
            <PrivacyPolicyManager />
            <TermsOfServiceManager />
          </div>
        </TabsContent>

        <TabsContent value="cookies" className="space-y-4">
          <CookieSettingsManager />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <MaintenanceModeToggle />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of your application</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Appearance settings will be available soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how notifications are sent</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Notification settings will be available soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure advanced system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Advanced settings will be available soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
