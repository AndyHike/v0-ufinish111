"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Package, Search, Filter, Smartphone, DollarSign, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

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
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/user/repair-orders")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch orders")
        }

        if (data.success) {
          setOrders(data.orders)
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
    return new Date(dateString).toLocaleDateString("uk-UA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "UAH",
    }).format(amount)
  }

  const formatWarranty = (period: number | null, units: string | null) => {
    if (!period || !units) return "Без гарантії"
    return `${period} ${units}`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Історія замовлень
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Завантаження замовлень...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Історія замовлень
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-destructive mb-4">Помилка завантаження: {error}</p>
              <Button onClick={() => window.location.reload()}>Спробувати знову</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Історія замовлень
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filter Controls */}
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

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {orders.length === 0 ? "Немає замовлень" : "Замовлення не знайдено"}
            </h3>
            <p className="text-muted-foreground">
              {orders.length === 0
                ? "У вас поки що немає жодного замовлення."
                : "Спробуйте змінити критерії пошуку або фільтрування."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-primary/20">
                <CardContent className="p-6">
                  {/* Desktop View */}
                  <div className="hidden md:block">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">Замовлення #{order.documentId}</h3>
                          <Badge className={cn("text-xs", order.overallStatusColor)}>{order.overallStatusName}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(order.creationDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Smartphone className="h-4 w-4" />
                            {order.deviceName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            S/N: {order.deviceSerialNumber}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{formatCurrency(order.totalAmount)}</div>
                        <div className="text-sm text-muted-foreground">Загальна сума</div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Послуги ({order.services.length})
                      </h4>
                      <div className="grid gap-3">
                        {order.services.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{service.name}</span>
                                <Badge variant="outline" className={cn("text-xs", service.statusColor)}>
                                  {service.statusName}
                                </Badge>
                              </div>
                              {(service.warrantyPeriod || service.warrantyUnits) && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Shield className="h-3 w-3" />
                                  Гарантія: {formatWarranty(service.warrantyPeriod, service.warrantyUnits)}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(service.price)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">#{order.documentId}</h3>
                        <Badge className={cn("text-xs", order.overallStatusColor)}>{order.overallStatusName}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(order.creationDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          {order.deviceName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          S/N: {order.deviceSerialNumber}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Послуги ({order.services.length})</h4>
                        <div className="text-lg font-bold text-primary">{formatCurrency(order.totalAmount)}</div>
                      </div>
                      <div className="space-y-2">
                        {order.services.map((service) => (
                          <div key={service.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{service.name}</span>
                              <span className="font-semibold text-sm">{formatCurrency(service.price)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="outline" className={cn(service.statusColor)}>
                                {service.statusName}
                              </Badge>
                              {(service.warrantyPeriod || service.warrantyUnits) && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Shield className="h-3 w-3" />
                                  {formatWarranty(service.warrantyPeriod, service.warrantyUnits)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
