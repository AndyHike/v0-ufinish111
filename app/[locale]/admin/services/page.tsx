import { getTranslations } from "next-intl/server"
import { ServicesManagement } from "@/components/admin/services-management"

export default async function AdminServicesPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale, namespace: "Admin" })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Управління послугами</h1>
        <p className="text-muted-foreground">Керуйте послугами, їх описами та FAQ</p>
      </div>
      <ServicesManagement />
    </div>
  )
}
