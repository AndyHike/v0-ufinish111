import { getTranslations } from "next-intl/server"
import { InfoBannerManager } from "@/components/admin/info-banner-manager"
import type { Metadata } from "next"

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Admin" })
  return {
    title: "Інформаційний банер - " + t("adminPanel"),
  }
}

export default async function BannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Інформаційний банер</h1>
        <p className="text-muted-foreground">Керуйте інформаційним банером на головній сторінці</p>
      </div>

      <InfoBannerManager />
    </div>
  )
}
