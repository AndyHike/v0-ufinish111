"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, Package, Search, Filter, Smartphone, DollarSign, Shield, RefreshCw, ChevronDown, ChevronUp, FileText } from "lucide-react"
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
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  // Toggle order expansion for mobile
  const toggleOrder = (orderId: string) => {
    const newDocs = new Set(expandedOrders)
    if (newDocs.has(orderId)) {
      newDocs.delete(orderId)
    } else {
      newDocs.add(orderId)
    }
    setExpandedOrders(newDocs)
  }

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
    if (statusColor.includes("bg-") && statusColor.includes("text-")) {
      return statusColor
    }
    if (statusColor.startsWith("#")) {
      return `text-white`
    }
    return "bg-gray-100 text-gray-800 border border-gray-200"
  }

  const getTranslatedValue = (value: string) => {
    if (value === "not_specified") return t("notSpecified")
    if (value === "unknown_device") return t("unknownDevice")
    if (value === "unknown_service") return t("unknownService")
    return value
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm border-destructive/20 bg-destructive/5">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto">
              <Package className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-destructive">{t("errorTitle")}</h3>
              <p className="text-muted-foreground mb-4 max-w-sm mx-auto">{error}</p>
              <Button onClick={fetchOrders} variant="outline" className="bg-background">
                {t("tryAgain")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 sm:w-auto w-full">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-background shadow-sm">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
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
          <Button onClick={fetchOrders} variant="outline" size="icon" className="shrink-0 bg-background shadow-sm">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="border-0 bg-muted/30 shadow-sm border-dashed border-2">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <div className="rounded-full bg-muted p-4 w-fit mx-auto">
                <Package className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <h3 className="text-lg font-medium">{orders.length === 0 ? t("noOrders") : t("noOrdersFound")}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {orders.length === 0 ? t("noOrdersDescription") : t("noOrdersFoundDescription")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-muted-foreground font-medium">
              {t("totalOrders", { count: filteredOrders.length })}
            </p>
          </div>

          {filteredOrders.map((order) => {
            const isExpanded = expandedOrders.has(order.id)

            return (
              <Card key={order.id} className="overflow-hidden border-0 shadow-sm transition-all hover:shadow-md ring-1 ring-border/50">
                {/* Header Section (Always Visible) */}
                <div
                  className={cn("p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer sm:cursor-default transition-colors", isExpanded ? "bg-muted/10" : "hover:bg-muted/30")}
                  onClick={() => {
                    // Only toggle on mobile screens, desktop always shows content
                    if (window.innerWidth < 640) toggleOrder(order.id)
                  }}
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <div className="flex items-center gap-2 text-primary font-semibold text-lg">
                        <FileText className="h-5 w-5" />
                        <span>#{getTranslatedValue(order.documentId)}</span>
                      </div>
                      <Badge
                        className={cn("text-xs font-medium border-0 px-2.5 py-0.5", getStatusBadgeClass(order.overallStatusColor))}
                        style={order.overallStatusColor.startsWith("#") ? { backgroundColor: order.overallStatusColor } : {}}
                      >
                        {order.overallStatusName}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 truncate">
                        <Smartphone className="h-4 w-4 shrink-0" />
                        <span className="truncate text-foreground font-medium">
                          {getTranslatedValue(order.deviceName)}
                          {(order.deviceBrand || order.deviceModel) && (
                            <span className="text-muted-foreground font-normal">
                              {order.deviceBrand ? ` • ${order.deviceBrand}` : ""}
                              {order.deviceModel ? ` ${order.deviceModel}` : ""}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        <span>{formatDate(order.creationDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                    <div className="text-sm text-muted-foreground sm:mb-1">{t("totalAmount")}</div>
                    <div className="flex items-center gap-3">
                      <div className="text-xl sm:text-2xl font-bold text-primary">
                        {formatCurrency(order.totalAmount)}
                      </div>
                      {/* Mobile expand icon */}
                      <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden -mr-2 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Details Section (Expandable on mobile, visible on desktop) */}
                <div className={cn("border-t bg-muted/5 sm:block origin-top transition-all", isExpanded ? "block animate-in slide-in-from-top-2" : "hidden")}>
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Device specifics */}
                    {order.deviceSerialNumber && order.deviceSerialNumber !== "not_specified" && (
                      <div className="flex items-center gap-2 text-sm bg-background p-3 rounded-lg border">
                        <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{t("serialNumber")}:</span>
                        <span className="font-medium font-mono">{getTranslatedValue(order.deviceSerialNumber)}</span>
                      </div>
                    )}

                    {/* Services List */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-1">
                        <Wrench className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{t("services", { count: order.services.length })}</h4>
                      </div>

                      <div className="grid gap-2 sm:gap-3">
                        {order.services.map((service, index) => (
                          <div
                            key={service.id || index}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-background rounded-lg border shadow-sm gap-3"
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <h5 className="font-medium text-sm sm:text-base leading-tight">
                                {getTranslatedValue(service.name)}
                              </h5>
                              {(service.warrantyPeriod || service.warrantyUnits) && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>
                                    {t("warranty")}: <span className="font-medium tracking-tight text-foreground/80">{formatWarranty(service.warrantyPeriod, service.warrantyUnits)}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right sm:text-right border-t sm:border-0 pt-2 sm:pt-0 mt-1 sm:mt-0 flex items-center justify-between sm:block">
                              <div className="text-xs text-muted-foreground sm:hidden">{t("price")}:</div>
                              <div className="font-semibold text-foreground text-sm sm:text-base">
                                {formatCurrency(service.price)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default UserOrders
