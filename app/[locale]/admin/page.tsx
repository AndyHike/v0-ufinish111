import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Admin" })
  return {
    title: t("dashboard"),
  }
}

export default async function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">Real-time traffic and visitor metrics</p>
      </div>
      <AnalyticsDashboard />
    </div>
  )
}
