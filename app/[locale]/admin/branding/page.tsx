import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Metadata } from "next"
import { SiteBrandingManager } from "@/components/admin/site-branding-manager"

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Admin" })
  return {
    title: t("branding"),
  }
}

export default async function BrandingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Branding</h1>
        <p className="text-muted-foreground">Manage your website's logo, favicon, and default language</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand Settings</CardTitle>
          <CardDescription>Upload your site logo, favicon, and configure default language</CardDescription>
        </CardHeader>
        <CardContent>
          <SiteBrandingManager />
        </CardContent>
      </Card>
    </div>
  )
}
