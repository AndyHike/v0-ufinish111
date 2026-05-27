import { getTranslations } from "next-intl/server"
import { DescriptionsList } from "@/components/admin/descriptions-list"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Admin" })
  return {
    title: t("descriptions"),
  }
}

export default async function DescriptionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Descriptions</h1>
      <DescriptionsList />
    </div>
  )
}
