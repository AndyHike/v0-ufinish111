import { ArticlesManagement } from "@/components/admin/articles-management"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Admin" })
  return {
    title: "Articles Management",
  }
}

export default async function ArticlesAdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Articles Management</h1>
        <p className="text-muted-foreground mt-2">Manage repair guides and tips</p>
      </div>
      <ArticlesManagement />
    </div>
  )
}
