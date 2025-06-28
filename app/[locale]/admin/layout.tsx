import type React from "react"
import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminAnalyticsBlocker } from "@/components/analytics/admin-analytics-blocker"
import { ConsoleBlocker } from "@/components/console-blocker"

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Administration panel for managing the repair service",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    redirect("/auth/signin")
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <ConsoleBlocker />
      <AdminAnalyticsBlocker />
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
