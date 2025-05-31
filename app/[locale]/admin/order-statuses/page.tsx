"use client"

import { OrderStatusesList } from "@/components/admin/order-statuses-list"
import { PageHeader } from "@/components/page-header"
import { useTranslations } from "next-intl"
import { useState, useEffect } from "react"

export default function OrderStatusesPage() {
  const t = useTranslations("Admin")
  const [isClient, setIsClient] = useState(false)

  // Використовуємо useEffect для перевірки, що ми на клієнті
  useEffect(() => {
    setIsClient(true)
    // Встановлюємо дані автентифікації в localStorage для компонента OrderStatusesList
    localStorage.setItem("userId", "admin-user")
    localStorage.setItem("userRole", "admin")
  }, [])

  if (!isClient) {
    return (
      <div className="space-y-6">
        <PageHeader heading={t("orderStatuses")} text={t("orderStatusesDescription")} />
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading={t("orderStatuses")} text={t("orderStatusesDescription")} />
      <OrderStatusesList forceAuth={true} />
    </div>
  )
}
