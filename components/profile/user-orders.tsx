// Оновлюємо компонент для адаптивного дизайну
"use client"

import React from "react"
import { useEffect, useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { cn } from "@/lib/utils"
import {
  Search,
  RefreshCw,
  Calendar,
  Smartphone,
  PenToolIcon as Tool,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useMediaQuery } from "@/hooks/use-media-query"

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
  statusName: string
  statusColor: string
  price: number | null
  created_at: string
  statusHistory?: OrderStatusHistory[]
}

// Замінимо функцію getStatusColorClass на більш сучасну версію з кращими візуальними ефектами
function getStatusColorClass(statusColor: string): string {
  // Сучасні кольори з градієнтами, тінями та покращеним дизайном
  const colorMap: Record<string, string> = {
    "bg-green-100 text-green-800":
      "bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200 shadow-sm hover:shadow-md transition-all duration-200 hover:from-green-100 hover:to-green-50",
    "bg-blue-100 text-blue-800":
      "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 hover:from-blue-100 hover:to-blue-50",
    "bg-amber-100 text-amber-800":
      "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border border-amber-200 shadow-sm hover:shadow-md transition-all duration-200 hover:from-amber-100 hover:to-amber-50",
    "bg-red-100 text-red-800":
      "bg-gradient-to-r from-red-50 to-red-100 text-red-800 border border-red-200 shadow-sm hover:shadow-md transition-all duration-200 hover:from-red-100 hover:to-red-50",
    "bg-purple-100 text-purple-800":
      "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border border-purple-200 shadow-sm hover:shadow-md transition-all duration-200 hover:from-purple-100 hover:to-purple-50",
    "bg-pink-100 text-pink-800":
      "bg-gradient-to-r from-pink-50 to-pink-100 text-pink-800 border border-pink-200 shadow-sm hover:shadow-md transition-all duration-200 hover:from-pink-100 hover:to-pink-50",
    "bg-indigo-100 text-indigo-800":
      "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm hover:shadow-md transition-all duration-200 hover:from-indigo-100 hover:to-indigo-50",
    "bg-gray-100 text-gray-800":
      "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:from-gray-100 hover:to-gray-50",
    "bg-teal-100 text-teal-800":
      "bg-gradient-to-r from-teal-50 to-teal-100 text-teal-800 border border-teal-200 shadow-sm hover:shadow-md transition-all duration-200 hover:from-teal-100 hover:to-teal-50",
    "bg-cyan-100 text-cyan-800":
      "bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-800 border border-cyan-200 shadow-sm hover:shadow-md transition-all duration-200 hover:from-cyan-100 hover:to-cyan-50",
    "bg-orange-100 text-orange-800":
      "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-800 border border-orange-200 shadow-sm hover:shadow-md transition-all duration-200 hover:from-orange-100 hover:to-orange-50",
    "bg-lime-100 text-lime-800":
      "bg-gradient-to-r from-lime-50 to-lime-100 text-lime-800 border border-lime-200 shadow-sm hover:shadow-md transition-all duration-200 hover:from-lime-100 hover:to-lime-50",
  }

  // Якщо колір не знайдено в мапі, повертаємо базовий стиль з градієнтом
  if (!colorMap[statusColor]) {
    return "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-800 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
  }

  return colorMap[statusColor]
}

// Також оновимо функцію getStatusIcon для кращого відображення іконок
function getStatusIcon(statusName: string) {
  const statusLower = statusName.toLowerCase()

  if (
    statusLower.includes("завершено") ||
    statusLower.includes("готов") ||
    statusLower.includes("видан") ||
    statusLower.includes("dokončeno") ||
    statusLower.includes("completed") ||
    statusLower.includes("done") ||
    statusLower.includes("ready")
  ) {
    return <CheckCircle2 className="h-4 w-4 animate-pulse" />
  } else if (
    statusLower.includes("процес") ||
    statusLower.includes("робот") ||
    statusLower.includes("zpracování") ||
    statusLower.includes("process") ||
    statusLower.includes("work")
  ) {
    return <Loader2 className="h-4 w-4 animate-spin" />
  } else {
    return <AlertCircle className="h-4 w-4" />
  }
}

export function UserOrders() {
  const t = useTranslations("Profile.repairHistory")
  const profileT = useTranslations("Profile")
  const commonT = useTranslations("Common")
  const locale = useLocale()
  const [orders, setOrders] = useState<RepairOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<RepairOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isClient, setIsClient] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  // Перевірка, чи це мобільний пристрій
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Встановлюємо isClient в true тільки на клієнті
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Завантаження замовлень через API тільки на клієнті
  useEffect(() => {
    if (isClient) {
      fetchOrders()
    }
  }, [t, locale, isClient])

  async function fetchOrders(forceRefresh = false) {
    if (!isClient) return

    try {
      if (forceRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)

      const response = await fetch(`/api/user/repair-orders?locale=${locale}&forceRefresh=${forceRefresh}`, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        cache: "no-store",
      })

      const data = await response.json()

      if (data.success && data.orders) {
        setOrders(data.orders)
        setFilteredOrders(data.orders)
      } else {
        setError(data.message || t("errorFetching"))
      }
    } catch (err) {
      console.error("Error fetching repair orders:", err)
      setError(t("errorFetching"))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Функція для примусового оновлення
  function handleRefresh() {
    fetchOrders(true)
  }

  // Функція для розгортання/згортання деталей замовлення
  function toggleOrderDetails(orderId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (expandedOrder === orderId) {
      setExpandedOrder(null)
    } else {
      setExpandedOrder(orderId)
    }
  }

  // Функція для відкриття деталей замовлення на мобільних
  function openOrderDetails(order: RepairOrder) {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  // Функція для закриття деталей замовлення на мобільних
  function closeOrderDetails() {
    setShowOrderDetails(false)
    setSelectedOrder(null)
  }

  // Фільтрація замовлень
  useEffect(() => {
    if (!isClient) return

    // Filter orders based on search query and active tab
    let filtered = orders

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.device_brand.toLowerCase().includes(query) ||
          order.device_model.toLowerCase().includes(query) ||
          order.reference_number.toLowerCase().includes(query) ||
          order.service_type.toLowerCase().includes(query) ||
          order.statusName.toLowerCase().includes(query),
      )
    }

    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((order) => {
        const statusId = Number.parseInt(order.status, 10)
        if (activeTab === "active") {
          // Активні замовлення - статуси "Новий" та "В роботі"
          return statusId === 3153189 || statusId === 3153184
        } else if (activeTab === "completed") {
          // Завершені замовлення - статуси "Готовий" та "Виданий"
          return statusId === 3153185 || statusId === 3153186
        }
        return true
      })
    }

    setFilteredOrders(filtered)
  }, [orders, searchQuery, activeTab, isClient])

  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date)
    } catch (e) {
      return dateString
    }
  }

  function formatDateTime(dateString: string) {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch (e) {
      return dateString
    }
  }

  // Якщо ми на сервері або ще не на клієнті, показуємо скелетон
  if (!isClient) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    )
  }

  // Компонент деталей замовлення для мобільної версії
  const OrderDetailsModal = () => {
    if (!selectedOrder) return null

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-background p-4 border-b flex items-center justify-between">
            <h3 className="font-medium">{t("orderDetails")}</h3>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={closeOrderDetails}>
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">{t("close")}</span>
            </Button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">{t("orderId")}:</div>
                <div>{selectedOrder.reference_number}</div>
                <div className="text-muted-foreground">{t("creationDate")}:</div>
                <div>{formatDateTime(selectedOrder.created_at)}</div>
                <div className="text-muted-foreground">{t("device")}:</div>
                <div>
                  {selectedOrder.device_brand} {selectedOrder.device_model}
                </div>
                <div className="text-muted-foreground">{t("service")}:</div>
                <div>{selectedOrder.service_type}</div>
                <div className="text-muted-foreground">{t("currentStatus")}:</div>
                <div>
                  <Badge
                    className={cn(
                      "font-medium text-xs py-1 px-2.5 rounded-full flex items-center gap-1.5",
                      getStatusColorClass(selectedOrder.statusColor),
                    )}
                  >
                    {getStatusIcon(selectedOrder.statusName)}
                    <span>{selectedOrder.statusName}</span>
                  </Badge>
                </div>
                <div className="text-muted-foreground">{t("price")}:</div>
                <div>{selectedOrder.price ? `${selectedOrder.price} ${t("currency")}` : t("notSpecified")}</div>
              </div>
            </div>

            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium">{t("statusHistory")}</h4>
                <div className="space-y-3 relative before:absolute before:left-1.5 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
                  {selectedOrder.statusHistory.map((history) => (
                    <div key={history.id} className="flex items-start pl-6 relative">
                      <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-primary"></div>
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <Badge
                            className={cn(
                              "font-medium text-xs py-1 px-2.5 rounded-full flex items-center gap-1.5",
                              getStatusColorClass(history.new_status_color || "bg-gray-100"),
                            )}
                          >
                            {getStatusIcon(history.new_status_name || history.new_status)}
                            <span>{history.new_status_name || history.new_status}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">{history.changed_by}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDateTime(history.changed_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Мобільна версія компонента
  const MobileView = () => {
    return (
      <div className="w-full">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Фільтри та пошук */}
            <div className="px-4 py-3 border-b">
              {/* Вкладки */}
              <div className="flex items-center space-x-2 mb-3 overflow-x-auto no-scrollbar">
                <Button
                  variant="outline"
                  size="sm"
                  className={activeTab === "all" ? "bg-primary/10 border-primary/50" : ""}
                  onClick={() => setActiveTab("all")}
                >
                  {t("allTab")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={activeTab === "active" ? "bg-primary/10 border-primary/50" : ""}
                  onClick={() => setActiveTab("active")}
                >
                  {t("activeTab")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={activeTab === "completed" ? "bg-primary/10 border-primary/50" : ""}
                  onClick={() => setActiveTab("completed")}
                >
                  {t("completedTab")}
                </Button>
              </div>

              {/* Пошук та оновлення */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("search")}
                    className="pl-9 h-9 text-sm w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="shrink-0">
                  <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                  <span className="sr-only">{refreshing ? t("refreshing") : t("refresh")}</span>
                </Button>
              </div>
            </div>

            {/* Список замовлень */}
            {loading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
                <p className="text-destructive font-medium mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={() => fetchOrders(true)}>
                  {t("tryAgain")}
                </Button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">
                  {searchQuery ? t("noSearchResults") : t("noOrders")}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 hover:bg-muted/20 transition-colors"
                    onClick={() => openOrderDetails(order)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{order.reference_number}</div>
                      <Badge
                        className={cn(
                          "font-medium text-xs py-1 px-2 rounded-full flex items-center gap-1",
                          getStatusColorClass(order.statusColor),
                        )}
                      >
                        {getStatusIcon(order.statusName)}
                        <span>{order.statusName}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        {formatDate(order.created_at)}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Tag className="h-3.5 w-3.5 mr-1.5" />
                        {order.price ? `${order.price} ${t("currency")}` : "-"}
                      </div>
                      <div className="flex items-center col-span-2">
                        <Smartphone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span>
                          {order.device_brand} {order.device_model}
                        </span>
                      </div>
                      <div className="flex items-center col-span-2">
                        <Tool className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span>{order.service_type}</span>
                      </div>
                    </div>

                    <div className="flex justify-end mt-2">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5 mr-1" />
                        {t("showDetails")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Модальне вікно з деталями замовлення */}
        {showOrderDetails && <OrderDetailsModal />}
      </div>
    )
  }

  // Десктопна версія компонента (оригінальна)
  const DesktopView = () => {
    return (
      <div className="w-full">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Фільтри та пошук */}
            <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={activeTab === "all" ? "bg-primary/10 border-primary/50" : ""}
                  onClick={() => setActiveTab("all")}
                >
                  {t("allTab")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={activeTab === "active" ? "bg-primary/10 border-primary/50" : ""}
                  onClick={() => setActiveTab("active")}
                >
                  {t("activeTab")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={activeTab === "completed" ? "bg-primary/10 border-primary/50" : ""}
                  onClick={() => setActiveTab("completed")}
                >
                  {t("completedTab")}
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={cn("h-4 w-4 mr-1", refreshing && "animate-spin")} />
                  {refreshing ? t("refreshing") : t("refresh")}
                </Button>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("search")}
                    className="pl-9 h-9 w-[150px] text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Таблиця замовлень */}
            {loading ? (
              <div className="p-4">
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
                <p className="text-destructive font-medium mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={() => fetchOrders(true)}>
                  {t("tryAgain")}
                </Button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">
                  {searchQuery ? t("noSearchResults") : t("noOrders")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">{t("idColumn")}</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                        {t("dateColumn")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                        {t("deviceColumn")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                        {t("serviceColumn")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                        {t("statusColumn")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                        {t("priceColumn")}
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm w-10">
                        {t("detailsColumn")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <React.Fragment key={order.id}>
                        <tr
                          className={cn(
                            "border-b hover:bg-muted/20 transition-colors",
                            expandedOrder === order.id && "bg-muted/10",
                          )}
                        >
                          <td className="py-3 px-4 text-sm font-medium">{order.reference_number}</td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              {formatDate(order.created_at)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center">
                              <Smartphone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              {order.device_brand} {order.device_model}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center">
                              <Tool className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              {order.service_type}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={cn(
                                "font-medium text-xs py-1 px-2.5 rounded-full flex items-center gap-1.5",
                                getStatusColorClass(order.statusColor),
                              )}
                            >
                              {getStatusIcon(order.statusName)}
                              <span>{order.statusName}</span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center">
                              <Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              {order.price ? `${order.price} ${t("currency")}` : "-"}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full"
                              onClick={(e) => toggleOrderDetails(order.id, e)}
                            >
                              {expandedOrder === order.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <span className="sr-only">{t("showDetails")}</span>
                            </Button>
                          </td>
                        </tr>
                        {expandedOrder === order.id && (
                          <tr className="bg-muted/5">
                            <td colSpan={7} className="py-4 px-6">
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium">{t("orderDetails")}</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div className="text-muted-foreground">{t("orderId")}:</div>
                                      <div>{order.reference_number}</div>
                                      <div className="text-muted-foreground">{t("creationDate")}:</div>
                                      <div>{formatDateTime(order.created_at)}</div>
                                      <div className="text-muted-foreground">{t("device")}:</div>
                                      <div>
                                        {order.device_brand} {order.device_model}
                                      </div>
                                      <div className="text-muted-foreground">{t("service")}:</div>
                                      <div>{order.service_type}</div>
                                      <div className="text-muted-foreground">{t("currentStatus")}:</div>
                                      <div>
                                        <Badge
                                          className={cn(
                                            "font-medium text-xs py-1 px-2.5 rounded-full flex items-center gap-1.5",
                                            getStatusColorClass(order.statusColor),
                                          )}
                                        >
                                          {getStatusIcon(order.statusName)}
                                          <span>{order.statusName}</span>
                                        </Badge>
                                      </div>
                                      <div className="text-muted-foreground">{t("price")}:</div>
                                      <div>{order.price ? `${order.price} ${t("currency")}` : t("notSpecified")}</div>
                                    </div>
                                  </div>

                                  {order.statusHistory && order.statusHistory.length > 0 && (
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium">{t("statusHistory")}</h4>
                                      <div className="space-y-3 relative before:absolute before:left-1.5 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
                                        {order.statusHistory.map((history, index) => (
                                          <div key={history.id} className="flex items-start pl-6 relative">
                                            <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-primary"></div>
                                            <div className="flex-1">
                                              <div className="flex items-center">
                                                <Badge
                                                  className={cn(
                                                    "font-medium text-xs py-1 px-2.5 rounded-full flex items-center gap-1.5",
                                                    getStatusColorClass(history.new_status_color || "bg-gray-100"),
                                                  )}
                                                >
                                                  {getStatusIcon(history.new_status_name || history.new_status)}
                                                  <span>{history.new_status_name || history.new_status}</span>
                                                </Badge>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                  {history.changed_by}
                                                </span>
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {formatDateTime(history.changed_at)}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Рендеримо відповідний вигляд залежно від розміру екрану
  return isMobile ? <MobileView /> : <DesktopView />
}

export default UserOrders
