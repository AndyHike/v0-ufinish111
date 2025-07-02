"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, Package, Search, Filter, Smartphone, DollarSign, Shield, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"

interface Service {
  id: string
  name: string
  price: number
  warrantyPeriod: number | null
  warrantyUnits: string | null
}

interface Order {
  id: string
  documentId: string
  creationDate: string
  deviceSerialNumber: string
  deviceName: string
  deviceBrand?: string
  deviceModel?: string
  services: Service[]
  totalAmount: number
  overallStatus: string
  overallStatusName: string
  overallStatusColor: string
}

export function UserOrders() {
  const t = useTranslations("orders")
  const params = useParams()
  const locale = (params.locale as string) || "uk"

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/user/repair-orders?locale=${locale}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t("fetchError"))
      }

      if (data.success) {
        setOrders(data.orders || [])
      } else {
        throw new Error(data.error || t("fetchError"))
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError(err instanceof Error ? err.message : t("fetchError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [locale])

  // Filter orders based on search term and status
  useEffect(() => {
    let filtered = orders

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.deviceSerialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.services.some((service) => service.name.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.overallStatus === statusFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  // Get unique statuses for filter dropdown
  const uniqueStatuses = Array.from(new Set(orders.map((order) => order.overallStatus)))

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return t("dateNotSpecified")
      }
      return date.toLocaleDateString(locale === "uk" ? "uk-UA" : locale === "en" ? "en-US" : "cs-CZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return t("dateNotSpecified")
    }
  }

  const formatWarranty = (period: number | null, units: string | null) => {
    if (!period || !units) return t("noWarranty")
    return `${period} ${units}`
  }

  // Helper function to convert status color to proper badge styling
  const getStatusBadgeClass = (statusColor: string) => {
    // If it's already a proper class string, use it
    if (statusColor.includes("bg-") && statusColor.includes("text-")) {
      return statusColor
    }

    // If it's a hex color, convert to appropriate badge style
    if (statusColor.startsWith("#")) {
      return `text-white`
    }

    // Default fallback
    return "bg-gray-100 text-gray-800 border border-gray-200"
  }

  // Helper function to get translated text for static values
  const getTranslatedValue = (value: string) => {
    if (value === "not_specified") return t("notSpecified")
    if (value === "unknown_device") return t("unknownDevice")
    if (value === "unknown_service") return t("unknownService")
    return value
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            {t("refresh")}
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="rounded-full bg-destructive/10 p-3 w-fit mx-auto">
                <Package className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t("errorTitle")}</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchOrders} variant="outline">
                  {t("tryAgain")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">
            {orders.length === 0 ? t("noOrdersYet") : t("totalOrders", { count: orders.length })}
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2 bg-transparent">
          <RefreshCw className="h-4 w-4" />
          {t("refresh")}
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  {uniqueStatuses.map((status) => {
                    const order = orders.find((o) => o.overallStatus === status)
                    return (
                      <SelectItem key={status} value={status}>
                        {order?.overallStatusName || status}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="rounded-full bg-muted p-3 w-fit mx-auto">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{orders.length === 0 ? t("noOrders") : t("noOrdersFound")}</h3>
                <p className="text-muted-foreground">
                  {orders.length === 0 ? t("noOrdersDescription") : t("noOrdersFoundDescription")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">
                        {t("orderNumber", { number: getTranslatedValue(order.documentId) })}
                      </CardTitle>
                      <Badge
                        className={cn("text-xs font-medium", getStatusBadgeClass(order.overallStatusColor))}
                        style={
                          order.overallStatusColor.startsWith("#") ? { backgroundColor: order.overallStatusColor } : {}
                        }
                      >
                        {order.overallStatusName}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>{formatDate(order.creationDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span>{getTranslatedValue(order.deviceName)}</span>
                        {order.deviceBrand && <span>• {order.deviceBrand}</span>}
                        {order.deviceModel && <span>• {order.deviceModel}</span>}
                      </div>
                    </div>
                    {order.deviceSerialNumber && order.deviceSerialNumber !== "not_specified" && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>
                          {t("serialNumber")}: {getTranslatedValue(order.deviceSerialNumber)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{formatCurrency(order.totalAmount)}</div>
                    <div className="text-sm text-muted-foreground">{t("totalAmount")}</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-semibold">{t("services", { count: order.services.length })}</h4>
                  </div>
                  <div className="grid gap-3">
                    {order.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{getTranslatedValue(service.name)}</span>
                          </div>
                          {(service.warrantyPeriod || service.warrantyUnits) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Shield className="h-3 w-3" />
                              <span>
                                {t("warranty")}: {formatWarranty(service.warrantyPeriod, service.warrantyUnits)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{formatCurrency(service.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
