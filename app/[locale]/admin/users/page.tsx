import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { UsersManagement } from "@/components/admin/users-management"

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage users in your system",
}

export default async function UsersPage() {
  const t = await getTranslations("Admin")

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t("users")}</h2>
      </div>
      <div className="space-y-4">
        <UsersManagement />
      </div>
    </div>
  )
}
