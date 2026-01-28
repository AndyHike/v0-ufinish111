import { AdminStats } from "@/components/admin/admin-stats"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { RecentActivity } from "@/components/admin/recent-activity"
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <AdminStats />
      <div className="border-t pt-6">
        <h2 className="text-2xl font-bold mb-4">Analytics</h2>
        <AnalyticsDashboard />
      </div>
      <RecentActivity />
    </div>
  )
}
