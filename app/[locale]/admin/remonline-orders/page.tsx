import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { RemonlineOrderSyncIssues } from "@/components/admin/remonline-order-sync-issues"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Admin.remonlineOrders" })

  return {
    title: t("title"),
  }
}

export default async function RemonlineOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Admin.remonlineOrders" })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>
      <RemonlineOrderSyncIssues />
    </div>
  )
}
