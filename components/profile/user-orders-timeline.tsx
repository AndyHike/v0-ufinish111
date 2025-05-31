"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { getStatusColor } from "@/lib/order-status-utils"
import { Badge } from "@/components/ui/badge"

type OrderStatusHistory = {
  id: string
  order_id: string
  old_status: string
  old_status_name?: string
  old_status_color?: string
  new_status: string
  new_status_name?: string
  new_status_color?: string
  changed_by: string
  changed_at: string
  created_at: string
}

type RepairOrder = {
  id: string
  reference_number: string
  device_brand: string
  device_model: string
  service_type: string
  status: string
  status_name?: string
  status_color?: string
  price: number | null
  created_at: string
  updated_at: string
  statusHistory?: OrderStatusHistory[]
}

interface TimelineEvent {
  id: string
  date: string
  device: string
  service: string
  status: string
  statusId: number
}

function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), "d MMM yyyy", { locale: uk })
  } catch (e) {
    return dateString
  }
}

export function UserOrdersTimeline() {
  const t = useTranslations("Profile")
  const tRepairHistory = useTranslations("Profile.repairHistory")
  const tCommon = useTranslations("Common")
  const locale = useLocale() // Отримуємо поточну локаль
  const [orders, setOrders] = useState<RepairOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  // Важливо: встановлюємо isClient в true тільки на клієнті
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Завантажуємо дані тільки на клієнті
  useEffect(() => {
    if (isClient) {
      fetchOrders()
    }
  }, [locale, isClient])

  // Функція для отримання замовлень
  async function fetchOrders(forceRefresh = false) {
    if (!isClient) return

    if (forceRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      // Використовуємо fetch для отримання даних з параметром forceRefresh
      const response = await fetch(`/api/user/order-history?locale=${locale}&forceRefresh=${forceRefresh}`, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        cache: "no-store",
      })

      const data = await response.json()

      if (data.success && data.orders) {
        setOrders(data.orders)
      } else {
        setError(data.message || tRepairHistory("errorFetching"))
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError(err instanceof Error ? err.message : tRepairHistory("errorFetching"))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Додаємо функцію для примусового оновлення
  function handleRefresh() {
    fetchOrders(true)
  }

  function getStatusIcon(statusCode: string) {
    // Перетворюємо рядок статусу на число
    const statusId = Number.parseInt(statusCode, 10)

    if (isNaN(statusId)) {
      return <Clock className="h-5 w-5 text-gray-500" />
    }

    // Визначаємо іконку на основі ID статусу
    switch (statusId) {
      case 3153189: // Новий
        return <Clock className="h-5 w-5 text-blue-500" />
      case 3153184: // В роботі
        return <RefreshCw className="h-5 w-5 text-amber-500" />
      case 3153185: // Готовий
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 3153186: // Виданий
        return <CheckCircle2 className="h-5 w-5 text-green-700" />
      case 3153187: // Скасований
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  // Якщо ми на сервері або ще не на клієнті, показуємо скелетон
  if (!isClient) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const filteredOrders = orders.filter((order) => {
    // Filter by tab
    if (activeTab === "active") {
      // Активні замовлення - статуси "Новий" та "В роботі"
      const statusId = Number.parseInt(order.status, 10)
      if (statusId !== 3153189 && statusId !== 3153184) {
        return false
      }
    }

    if (activeTab === "completed") {
      // Завершені замовлення - статуси "Готовий" та "Виданий"
      const statusId = Number.parseInt(order.status, 10)
      if (statusId !== 3153185 && statusId !== 3153186) {
        return false
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        order.reference_number.toLowerCase().includes(query) ||
        order.device_brand.toLowerCase().includes(query) ||
        order.device_model.toLowerCase().includes(query) ||
        (order.status_name && order.status_name.toLowerCase().includes(query))
      )
    }

    return true
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{tRepairHistory("loadingError")}</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          {tRepairHistory("tryAgain")}
        </Button>
      </div>
    )
  }

  const timelineEvents: TimelineEvent[] = filteredOrders.map((order) => ({
    id: order.id,
    date: order.created_at,
    device: `${order.device_brand} ${order.device_model}`,
    service: order.service_type,
    status: order.status_name || order.status,
    statusId: Number.parseInt(order.status, 10),
  }))

  return <UserOrdersTimelineComponent events={timelineEvents} />
}

function UserOrdersTimelineComponent({ events }: { events: TimelineEvent[] }) {
  const t = useTranslations("Profile")
  const tRepairHistory = useTranslations("Profile.repairHistory")
  const tCommon = useTranslations("Common")

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">{tRepairHistory("noOrders")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {events.map((event, index) => (
        <div key={event.id} className="relative">
          {/* Timeline connector */}
          {index < events.length - 1 && <div className="absolute left-7 top-7 bottom-0 w-0.5 bg-gray-200" />}

          <div className="flex gap-4">
            {/* Timeline dot */}
            <div className="relative flex h-14 w-14 flex-none items-center justify-center rounded-full bg-blue-50">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
            </div>

            {/* Content */}
            <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {tRepairHistory("orderNumber")}: {event.id}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                </div>
                <Badge className={`text-xs px-3 py-1 rounded-full ${getStatusColor(event.statusId)}`}>
                  {tCommon(`orderStatuses.${event.status.toLowerCase()}`) || event.status}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500">{t("device")}</p>
                  <p className="text-sm">{event.device}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("service")}</p>
                  <p className="text-sm">{event.service}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
