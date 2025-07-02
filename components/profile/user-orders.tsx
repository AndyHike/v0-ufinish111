"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, Package, Search, Filter, Smartphone, DollarSign, Shield, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

interface Service {
  id: string
  name: string
  price: number
  warrantyPeriod: number | null
  warrantyUnits: string | null
  status: string
  statusName: string
  statusColor: string
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
      const response = await fetch("/api/user/repair-orders")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch orders")
      }

      if (data.success) {
        setOrders(data.orders || [])
      } else {
        throw new Error(data.error || "Failed to fetch orders")
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

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
        return "Дата не вказана"
      }
      return date.toLocaleDateString("uk-UA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Дата не вказана"
    }
  }

  const formatWarranty = (period: number | null, units: string | null) => {
    if (!period || !units) return "Без гарантії"
    return `${period} ${units}`
  }

  const getStatusVariant = (status: string) => {
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes("completed") || lowerStatus.includes("done") || lowerStatus.includes("готово")) {
      return "default"
    }
    if (lowerStatus.includes("progress") || lowerStatus.includes("work") || lowerStatus.includes("виконується")) {
      return "secondary"
    }
    if (lowerStatus.includes("new") || lowerStatus.includes("pending") || lowerStatus.includes("новий")) {
      return "outline"
    }
    return "outline"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Історія замовлень</h2>
            <p className="text-muted-foreground">Переглядайте статус ваших ремонтів</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Завантаження замовлень...</p>
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
            <h2 className="text-3xl font-bold tracking-tight">Історія замовлень</h2>
            <p className="text-muted-foreground">Переглядайте статус ваших ремонтів</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Оновити
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="rounded-full bg-destructive/10 p-3 w-fit mx-auto">
                <Package className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Помилка завантаження</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchOrders} variant="outline">
                  Спробувати знову
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
          <h2 className="text-3xl font-bold tracking-tight">Історія замовлень</h2>
          <p className="text-muted-foreground">
            {orders.length === 0 ? "Поки що немає замовлень" : `Всього ${orders.length} замовлень`}
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2 bg-transparent">
          <RefreshCw className="h-4 w-4" />
          Оновити
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Пошук за номером замовлення, пристроєм або послугою..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Фільтр за статусом" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі статуси</SelectItem>
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
                <h3 className="text-lg font-semibold">
                  {orders.length === 0 ? "Немає замовлень" : "Замовлення не знайдено"}
                </h3>
                <p className="text-muted-foreground">
                  {orders.length === 0
                    ? "Коли ви зробите замовлення на ремонт, воно з'явиться тут."
                    : "Спробуйте змінити критерії пошуку або фільтрування."}
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
                      <CardTitle className="text-xl">Замовлення #{order.documentId}</CardTitle>
                      <Badge variant={getStatusVariant(order.overallStatus)} className="text-xs">
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
                        <span>{order.deviceName}</span>
                        {order.deviceBrand && <span>• {order.deviceBrand}</span>}
                        {order.deviceModel && <span>• {order.deviceModel}</span>}
                      </div>
                    </div>
                    {order.deviceSerialNumber && order.deviceSerialNumber !== "Не вказано" && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>Серійний номер: {order.deviceSerialNumber}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{formatCurrency(order.totalAmount)}</div>
                    <div className="text-sm text-muted-foreground">Загальна сума</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-semibold">Послуги ({order.services.length})</h4>
                  </div>
                  <div className="grid gap-3">
                    {order.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{service.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {service.statusName}
                            </Badge>
                          </div>
                          {(service.warrantyPeriod || service.warrantyUnits) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Shield className="h-3 w-3" />
                              <span>Гарантія: {formatWarranty(service.warrantyPeriod, service.warrantyUnits)}</span>
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
