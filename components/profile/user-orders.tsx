"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Smartphone, Wrench, Clock, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface RepairService {
  id: string
  name: string
  price: number
  warrantyPeriod?: number
  warrantyUnits?: string
  status: string
  statusName?: string
  statusColor?: string
}

interface RepairOrder {
  id: string
  documentId: string
  createdAt: string
  deviceSerial?: string
  deviceName: string
  deviceBrand?: string
  deviceModel?: string
  services: RepairService[]
  totalAmount: number
  status: string
  statusName?: string
  statusColor?: string
}

export function UserOrders() {
  const [orders, setOrders] = useState<RepairOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔍 Fetching user orders...")

      const response = await fetch("/api/user/repair-orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ Error response:", errorData)
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📋 Received orders data:", data)

      setOrders(data.orders || [])
    } catch (error) {
      console.error("💥 Error fetching orders:", error)
      setError(error instanceof Error ? error.message : "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("uk-UA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "UAH",
    }).format(amount)
  }

  const getStatusColor = (status: string, statusColor?: string) => {
    if (statusColor) return statusColor

    // Default status colors
    switch (status.toLowerCase()) {
      case "completed":
      case "готово":
        return "bg-green-100 text-green-800"
      case "in_progress":
      case "в роботі":
        return "bg-blue-100 text-blue-800"
      case "pending":
      case "очікує":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
      case "скасовано":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Історія ремонтів</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Історія ремонтів</h3>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Помилка завантаження історії ремонтів: {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Історія ремонтів</h3>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">У вас поки немає історії ремонтів</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Замовлення #{order.documentId}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(order.createdAt)}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(order.status, order.statusColor)}>
                    {order.statusName || order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.deviceName}</span>
                  {order.deviceBrand && (
                    <span className="text-muted-foreground">
                      ({order.deviceBrand} {order.deviceModel})
                    </span>
                  )}
                </div>

                {order.deviceSerial && (
                  <div className="text-sm text-muted-foreground">Серійний номер: {order.deviceSerial}</div>
                )}

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Послуги:</h4>
                  {order.services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between py-2">
                      <div className="flex-1">
                        <div className="font-medium">{service.name}</div>
                        {service.warrantyPeriod && (
                          <div className="text-sm text-muted-foreground">
                            Гарантія: {service.warrantyPeriod} {service.warrantyUnits || "днів"}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(service.status, service.statusColor)}>
                          {service.statusName || service.status}
                        </Badge>
                        <span className="font-medium">{formatCurrency(service.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between items-center font-semibold">
                  <span>Загальна сума:</span>
                  <span className="text-lg">{formatCurrency(order.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
