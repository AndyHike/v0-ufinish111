import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Shield, FileText, Cookie, AlertTriangle } from "lucide-react"

// Import all admin components
import { LanguageSelector } from "@/components/admin/language-selector"
import { LogoUpload } from "@/components/admin/logo-upload"
import { FaviconUpload } from "@/components/admin/favicon-upload"
import { RegistrationToggle } from "@/components/admin/registration-toggle"
import { PrivacyPolicyManager } from "@/components/admin/privacy-policy-manager"
import { TermsOfServiceManager } from "@/components/admin/terms-of-service-manager"
import { CookieSettingsManager } from "@/components/admin/cookie-settings-manager"
import { MaintenanceModeToggle } from "@/components/admin/maintenance-mode-toggle"

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Налаштування сайту</h1>
        <p className="text-muted-foreground">Управління загальними налаштуваннями та конфігурацією сайту</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Загальні
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Безпека
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Контент
          </TabsTrigger>
          <TabsTrigger value="cookies" className="flex items-center gap-2">
            <Cookie className="h-4 w-4" />
            Cookies & Аналітика
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Технічні роботи
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Загальні налаштування</CardTitle>
              <CardDescription>Основні налаштування сайту та локалізація</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Suspense fallback={<LoadingSkeleton />}>
                <LanguageSelector />
              </Suspense>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Логотип сайту</CardTitle>
                <CardDescription>Завантажте логотип для відображення в header</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<LoadingSkeleton />}>
                  <LogoUpload />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Favicon</CardTitle>
                <CardDescription>Завантажте favicon для вкладки браузера</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<LoadingSkeleton />}>
                  <FaviconUpload />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Налаштування безпеки</CardTitle>
              <CardDescription>Управління доступом та реєстрацією користувачів</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingSkeleton />}>
                <RegistrationToggle />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Політика конфіденційності</CardTitle>
                <CardDescription>Управління текстом політики конфіденційності</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<LoadingSkeleton />}>
                  <PrivacyPolicyManager />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Умови користування</CardTitle>
                <CardDescription>Управління текстом умов користування</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<LoadingSkeleton />}>
                  <TermsOfServiceManager />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cookies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cookies та аналітика</CardTitle>
              <CardDescription>Налаштування аналітичних сервісів та маркетингових інструментів</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingSkeleton />}>
                <CookieSettingsManager />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Suspense fallback={<LoadingSkeleton />}>
            <MaintenanceModeToggle />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
