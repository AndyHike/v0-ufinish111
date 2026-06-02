"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FileText,
  Package,
  RefreshCw,
  Search,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Wrench,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

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

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : locale === "en" ? "en-US" : "cs-CZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function OrderStatusBadge({ color, name }: { color: string; name: string }) {
  const hasHex = color?.startsWith("#")
  const hasTailwind = color?.includes("bg-") && color?.includes("text-")

  return (
    <Badge
      className={cn(
        "min-h-7 rounded-md border px-2.5 py-1 text-xs font-medium",
        hasTailwind ? color : "border-border bg-muted text-foreground",
        hasHex && "border-transparent text-white",
      )}
      style={hasHex ? { backgroundColor: color } : undefined}
    >
      {name}
    </Badge>
  )
}

function OrderServices({ services }: { services: Service[] }) {
  const t = useTranslations("orders")

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
        <Wrench className="h-3.5 w-3.5" />
        {t("services", { count: services.length })}
      </div>
      <div className="space-y-2">
        {services.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-background px-3 py-3 text-sm text-muted-foreground">
            {t("unknownService")}
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="flex flex-col gap-2 rounded-lg border bg-background px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="truncate text-sm font-medium">{service.name || t("unknownService")}</div>
                {(service.warrantyPeriod || service.warrantyUnits) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-emerald-600" />
                    <span>
                      {t("warranty")}: {service.warrantyPeriod || ""} {service.warrantyUnits || ""}
                    </span>
                  </div>
                )}
              </div>
              <div className="shrink-0 text-sm font-semibold">{formatCurrency(service.price)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
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
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/user/repair-orders?locale=${locale}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || t("fetchError"))
      }

      setOrders(data.orders || [])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : t("fetchError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [locale])

  const filteredOrders = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesSearch =
        !search ||
        order.documentId.toLowerCase().includes(search) ||
        order.deviceName.toLowerCase().includes(search) ||
        order.deviceSerialNumber.toLowerCase().includes(search) ||
        order.services.some((service) => service.name.toLowerCase().includes(search))

      const matchesStatus = statusFilter === "all" || order.overallStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, searchTerm, statusFilter])

  const uniqueStatuses = useMemo(() => Array.from(new Set(orders.map((order) => order.overallStatus))), [orders])

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((current) => {
      const next = new Set(current)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const getText = (value: string) => {
    if (value === "not_specified") return t("notSpecified")
    if (value === "unknown_device") return t("unknownDevice")
    if (value === "unknown_service") return t("unknownService")
    return value
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm ring-1 ring-border/50">
        <CardContent className="flex items-center justify-center py-16">
          <div className="space-y-3 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
        <CardContent className="flex items-center justify-center py-14">
          <div className="max-w-sm space-y-4 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-destructive">{t("errorTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" onClick={fetchOrders} className="bg-background">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("tryAgain")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="bg-background pl-9 shadow-sm"
          />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-background shadow-sm sm:w-56">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder={t("filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              {uniqueStatuses.map((status) => {
                const order = orders.find((item) => item.overallStatus === status)
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

      {filteredOrders.length === 0 ? (
        <Card className="border-dashed bg-muted/20 shadow-sm">
          <CardContent className="flex items-center justify-center py-14">
            <div className="max-w-sm space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-background ring-1 ring-border">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{orders.length === 0 ? t("noOrders") : t("noOrdersFound")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {orders.length === 0 ? t("noOrdersDescription") : t("noOrdersFoundDescription")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="px-1 text-sm font-medium text-muted-foreground">
            {t("totalOrders")}: {filteredOrders.length}
          </div>

          {filteredOrders.map((order) => {
            const expanded = expandedOrders.has(order.id)
            const createdAt = formatDate(order.creationDate, locale)

            return (
              <Card key={order.id} className="overflow-hidden border-0 shadow-sm ring-1 ring-border/60">
                <button
                  type="button"
                  onClick={() => toggleOrder(order.id)}
                  className="w-full p-4 text-left transition-colors hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:p-5"
                  aria-expanded={expanded}
                >
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex min-w-0 items-center gap-2 text-base font-semibold">
                          <FileText className="h-5 w-5 shrink-0 text-primary" />
                          <span className="truncate">#{getText(order.documentId)}</span>
                        </div>
                        <OrderStatusBadge color={order.overallStatusColor} name={order.overallStatusName} />
                      </div>

                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Smartphone className="h-4 w-4 shrink-0" />
                          <span className="truncate font-medium text-foreground">
                            {getText(order.deviceName)}
                            {order.deviceBrand ? ` - ${order.deviceBrand}` : ""}
                            {order.deviceModel ? ` ${order.deviceModel}` : ""}
                          </span>
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0" />
                          <span className="truncate">{createdAt || t("dateNotSpecified")}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{t("services", { count: order.services.length })}: {order.services.length}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
                      <div>
                        <div className="text-xs text-muted-foreground">{t("totalAmount")}</div>
                        <div className="mt-1 text-lg font-semibold text-primary sm:text-xl">
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </div>
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {expanded && (
                  <div className="border-t bg-muted/10 p-4 sm:p-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,300px)]">
                      <OrderServices services={order.services} />
                      <div className="rounded-lg border bg-background px-3 py-3 text-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                          <Package className="h-3.5 w-3.5" />
                          {t("serialNumber")}
                        </div>
                        <div className="mt-2 break-words font-mono text-sm">
                          {getText(order.deviceSerialNumber)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default UserOrders
