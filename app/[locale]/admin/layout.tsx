import type React from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Admin" })
  return {
    title: t("adminPanel"),
  }
}

export default async function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const session = await getSession()

  if (!session?.user || session.user.role !== "admin") {
    redirect(`/${locale}/auth/login`)
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
