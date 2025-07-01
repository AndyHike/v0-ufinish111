"use client"

import React from "react"
import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import { cn } from "@/lib/utils"
import {
  Search,
  RefreshCw,
  Calendar,
  Smartphone,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  Shield,
  Package,
  Hash,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useMediaQuery } from "@/hooks/use-media-query"

// Типи для нової структури замовлень
type OrderService = {
  id: string
  name: string
  price: number
  warranty_period?: number
  warranty_units?: string // days, weeks, months, years
  status: string
  status_name: string
  status_color: string
}

type RepairOrder = {
  id: string
  document_id: string
  creation_date: string
  device_serial_number: string
  device_name: string
  device_brand: string
  device_model: string
  services: OrderService[]
  total_amount: number
  overall_status: string
  overall_status_name: string
  overall_status_color: string
}

function getStatusColorClass(statusColor: string): string {
  const colorMap: Record<string, string> = {
    "bg-green-100 text-green-800":
      "bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200 shadow-sm hover:shadow-md transition-all duration-200",
    "bg-blue-100 text-blue-800":
      "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200",
    "bg-amber-100 text-amber-800":
      "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border border-amber-200 shadow-sm hover:shadow-md transition-all duration-200",
    "bg-red-100 text-red-800":
      "bg-gradient-to-r from-red-50 to-red-100 text-red-800 border border-red-200 shadow-sm hover:shadow-md transition-all duration-200",
    "bg-gray-100 text-gray-800":
      "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200",
  }

  return (
    colorMap[statusColor] ||
    "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-800 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
  )
}

function getStatusIcon(statusName: string) {
  const statusLower = statusName.toLowerCase()

  if (statusLower.includes("завершено") || statusLower.includes("готов") || statusLower.includes("completed")) {
    return <CheckCircle2 className="h-4 w-4" />
  } else if (statusLower.includes("роботі") || statusLower.includes("process") || statusLower.includes("progress")) {
    return <Loader2 className="h-4 w-4 animate-spin" />
  } else if (statusLower.includes("очікує") || statusLower.includes("pending")) {
    return <Clock className="h-4 w-4" />
  } else {
    return <AlertCircle className="h-4 w-4" />
  }
}

function formatWarranty(period: number | undefined, units: string | undefined, locale: string): string {
  if (!period || period === 0) return "Без гарантії"

  const unitTranslations: Record<string, Record<string, string>> = {
    uk: {
      days: period === 1 ? "день" : period < 5 ? "дні" : "днів",
      weeks: period === 1 ? "тиждень" : period < 5 ? "тижні" : "тижнів",
      months: period === 1 ? "місяць" : period < 5 ? "місяці" : "місяців",
      years: period === 1 ? "рік" : period < 5 ? "роки" : "років",
    },
    en: {
      days: period === 1 ? "day" : "days",
      weeks: period === 1 ? "week" : "weeks",
      months: period === 1 ? "month" : "months",
      years: period === 1 ? "year" : "years",
    },
    cs: {
      days: period === 1 ? "den" : period < 5 ? "dny" : "dnů",
      weeks: period === 1 ? "týden" : period < 5 ? "týdny" : "týdnů",
      months: period === 1 ? "měsíc" : period < 5 ? "měsíce" : "měsíců",
      years: period === 1 ? "rok" : period < 5 ? "roky" : "let",
    },
  }

  const unit = unitTranslations[locale]?.[units || "months"] || units
  return `${period} ${unit}`
}

export function UserOrders() {
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

  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchOrders()
    }
  }, [isClient, locale])

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
        setError(data.message || "Помилка завантаження замовлень")
      }
    } catch (err) {
      console.error("Error fetching repair orders:", err)
      setError("Помилка завантаження замовлень")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function handleRefresh() {
    fetchOrders(true)
  }

  function toggleOrderDetails(orderId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (expandedOrder === orderId) {
      setExpandedOrder(null)
    } else {
      setExpandedOrder(orderId)
    }
  }

  function openOrderDetails(order: RepairOrder) {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  function closeOrderDetails() {
    setShowOrderDetails(false)
    setSelectedOrder(null)
  }

  useEffect(() => {
    if (!isClient) return

    let filtered = orders

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.document_id.toLowerCase().includes(query) ||
          order.device_name.toLowerCase().includes(query) ||
          order.device_serial_number.toLowerCase().includes(query) ||
          order.device_brand.toLowerCase().includes(query) ||
          order.device_model.toLowerCase().includes(query) ||
          order.services.some((service) => service.name.toLowerCase().includes(query)),
      )
    }

    if (activeTab !== "all") {
      filtered = filtered.filter((order) => {
        if (activeTab === "active") {
          return order.overall_status === "in_progress" || order.overall_status === "new"
        } else if (activeTab === "completed") {
          return order.overall_status === "completed"
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

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: locale === "cs" ? "CZK" : "UAH",
    }).format(amount)
  }

  if (!isClient) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    )
  }

  const OrderDetailsModal = () => {
    if (!selectedOrder) return null

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-background p-4 border-b flex items-center justify-between">
            <h3 className="font-medium">Деталі замовлення</h3>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={closeOrderDetails}>
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">Закрити</span>
            </Button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">ID документу:</div>
                <div>{selectedOrder.document_id}</div>
                <div className="text-muted-foreground">Дата створення:</div>
                <div>{formatDateTime(selectedOrder.creation_date)}</div>
                <div className="text-muted-foreground">Серійний номер:</div>
                <div>{selectedOrder.device_serial_number}</div>
                <div className="text-muted-foreground">Пристрій:</div>
                <div>{selectedOrder.device_name}</div>
                <div className="text-muted-foreground">Загальний статус:</div>
                <div>
                  <Badge
                    className={cn(
                      "font-medium text-xs py-1 px-2.5 rounded-full flex items-center gap-1.5",
                      getStatusColorClass(selectedOrder.overall_status_color),
                    )}
                  >
                    {getStatusIcon(selectedOrder.overall_status_name)}
                    <span>{selectedOrder.overall_status_name}</span>
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Послуги ({selectedOrder.services.length})
              </h4>
              <div className="space-y-3">
                {selectedOrder.services.map((service) => (
                  <div key={service.id} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm">{service.name}</div>
                      <div className="text-sm font-medium">{formatCurrency(service.price)}</div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Гарантія: {formatWarranty(service.warranty_period, service.warranty_units, locale)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          className={cn(
                            "font-medium text-xs py-1 px-2 rounded-full flex items-center gap-1",
                            getStatusColorClass(service.status_color),
                          )}
                        >
                          {getStatusIcon(service.status_name)}
                          <span>{service.status_name}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between items-center font-medium">
                  <span>Загальна сума:</span>
                  <span>{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const MobileView = () => {
    return (
      <div className="w-full">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Історія замовлень</CardTitle>
            <CardDescription>Переглядайте статус ваших ремонтів</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b">
              <div className="flex items-center space-x-2 mb-3 overflow-x-auto no-scrollbar">
                <Button
                  variant="outline"
                  size="sm"
                  className={activeTab === "all" ? "bg-primary/10 border-primary/50" : ""}
                  onClick={() => setActiveTab("all")}
                >
                  Всі
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={activeTab === "active" ? "bg-primary/10 border-primary/50" : ""}
                  onClick={() => setActiveTab("active")}
                >
                  Активні
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={activeTab === "completed" ? "bg-primary/10 border-primary/50" : ""}
                  onClick={() => setActiveTab("completed")}
                >
                  Завершені
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Пошук за ID, пристроєм, послугою..."
                    className="pl-9 h-9 text-sm w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="shrink-0">
                  <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                  <span className="sr-only">{refreshing ? "Оновлення..." : "Оновити"}</span>
                </Button>
              </div>
            </div>

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
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Спробувати знову
                </Button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">
                  {searchQuery ? "Нічого не знайдено" : "Немає замовлень"}
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
                      <div className="font-medium">{order.document_id}</div>
                      <Badge
                        className={cn(
                          "font-medium text-xs py-1 px-2 rounded-full flex items-center gap-1",
                          getStatusColorClass(order.overall_status_color),
                        )}
                      >
                        {getStatusIcon(order.overall_status_name)}
                        <span>{order.overall_status_name}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        {formatDate(order.creation_date)}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Tag className="h-3.5 w-3.5 mr-1.5" />
                        {formatCurrency(order.total_amount)}
                      </div>
                      <div className="flex items-center col-span-2">
                        <Smartphone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span>{order.device_name}</span>
                      </div>
                      <div className="flex items-center col-span-2">
                        <Hash className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span>{order.device_serial_number}</span>
                      </div>
                      <div className="flex items-center col-span-2">
                        <Package className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span>{order.services.length} послуг</span>
                      </div>
                    </div>

                    <div className="flex justify-end mt-2">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5 mr-1" />
                        Деталі
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {showOrderDetails && <OrderDetailsModal />}
      </div>
    )
  }

  const DesktopView = () => {
    return (
      <div className="w-full">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Історія замовлень</CardTitle>
            <CardDescription>Переглядайте статус ваших ремонтів</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={activeTab === "all" ? "bg-primary/10 border-primary/50" : ""}
                  onClick={() => setActiveTab("all")}
                >
                  Всі
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={activeTab === "active" ? "bg-primary/10 border-primary/50" : ""}
                  onClick={() => setActiveTab("active")}
                >
                  Активні
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={activeTab === "completed" ? "bg-primary/10 border-primary/50" : ""}
                  onClick={() => setActiveTab("completed")}
                >
                  Завершені
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={cn("h-4 w-4 mr-1", refreshing && "animate-spin")} />
                  {refreshing ? "Оновлення..." : "Оновити"}
                </Button>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Пошук..."
                    className="pl-9 h-9 w-[200px] text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

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
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Спробувати знову
                </Button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">
                  {searchQuery ? "Нічого не знайдено" : "Немає замовлень"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">ID документу</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Дата</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Пристрій</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Серійний номер</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Послуги</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Статус</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Сума</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm w-10">Деталі</th>
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
                          <td className="py-3 px-4 text-sm font-medium">{order.document_id}</td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              {formatDate(order.creation_date)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center">
                              <Smartphone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              {order.device_name}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center">
                              <Hash className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              {order.device_serial_number}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center">
                              <Package className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              {order.services.length} послуг
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={cn(
                                "font-medium text-xs py-1 px-2.5 rounded-full flex items-center gap-1.5",
                                getStatusColorClass(order.overall_status_color),
                              )}
                            >
                              {getStatusIcon(order.overall_status_name)}
                              <span>{order.overall_status_name}</span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center">
                              <Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              {formatCurrency(order.total_amount)}
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
                              <span className="sr-only">Показати деталі</span>
                            </Button>
                          </td>
                        </tr>
                        {expandedOrder === order.id && (
                          <tr className="bg-muted/5">
                            <td colSpan={8} className="py-4 px-6">
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Деталі замовлення</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div className="text-muted-foreground">ID документу:</div>
                                      <div>{order.document_id}</div>
                                      <div className="text-muted-foreground">Дата створення:</div>
                                      <div>{formatDateTime(order.creation_date)}</div>
                                      <div className="text-muted-foreground">Пристрій:</div>
                                      <div>{order.device_name}</div>
                                      <div className="text-muted-foreground">Серійний номер:</div>
                                      <div>{order.device_serial_number}</div>
                                      <div className="text-muted-foreground">Загальний статус:</div>
                                      <div>
                                        <Badge
                                          className={cn(
                                            "font-medium text-xs py-1 px-2.5 rounded-full flex items-center gap-1.5",
                                            getStatusColorClass(order.overall_status_color),
                                          )}
                                        >
                                          {getStatusIcon(order.overall_status_name)}
                                          <span>{order.overall_status_name}</span>
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                      <Package className="h-4 w-4" />
                                      Послуги ({order.services.length})
                                    </h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {order.services.map((service) => (
                                        <div key={service.id} className="bg-muted/30 rounded-lg p-3">
                                          <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-sm">{service.name}</div>
                                            <div className="text-sm font-medium">{formatCurrency(service.price)}</div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                              <Shield className="h-3 w-3" />
                                              Гарантія:{" "}
                                              {formatWarranty(service.warranty_period, service.warranty_units, locale)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Badge
                                                className={cn(
                                                  "font-medium text-xs py-1 px-2 rounded-full flex items-center gap-1",
                                                  getStatusColorClass(service.status_color),
                                                )}
                                              >
                                                {getStatusIcon(service.status_name)}
                                                <span>{service.status_name}</span>
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      <div className="border-t pt-2 flex justify-between items-center font-medium">
                                        <span>Загальна сума:</span>
                                        <span>{formatCurrency(order.total_amount)}</span>
                                      </div>
                                    </div>
                                  </div>
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

  return isMobile ? <MobileView /> : <DesktopView />
}

export default UserOrders
