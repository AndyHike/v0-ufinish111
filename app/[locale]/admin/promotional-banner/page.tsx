import { getTranslations } from "next-intl/server"
import { PromotionalBannerManager } from "@/components/admin/promotional-banner-manager"
import type { Metadata } from "next"

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Admin" })
  return {
    title: "Акційний банер - " + t("adminPanel"),
  }
}

export default async function PromotionalBannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Акційний банер</h1>
        <p className="text-muted-foreground">Керуйте акційним банером над меню навігації</p>
      </div>

      <PromotionalBannerManager />
    </div>
  )
}
