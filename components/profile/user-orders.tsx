"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Package, Calendar, Smartphone, DollarSign, AlertCircle, CheckCircle } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

interface OrderService {
  id: number
  name: string
  price: number
  warrantyPeriod?: number
  warrantyUnits?: string
  status?: string
  statusName?: string
  statusColor?: string
}

interface RepairOrder {
  id: number
  documentId: string
  createdAt: string
  creationDate?: string
  deviceSerial?: string
  deviceSerialNumber?: string
  deviceName: string
  deviceBrand?: string
  deviceModel?: string
  totalAmount: number
  status: string
  statusName?: string
  statusColor?: string
  overallStatus?: string
  overallStatusName?: string
  overallStatusColor?: string
  services: OrderService[]
}

interface ApiResponse {
  success?: boolean
  orders?: RepairOrder[]
  total?: number
  error?: string
  details?: string
  suggestion?: string
}

export function UserOrders() {
  const [orders, setOrders] = useState<RepairOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      console.log("🔍 Fetching user repair orders...")

      const response = await fetch("/api/user/repair-orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      console.log("📡 Response status:", response.status)
      console.log("📡 Response ok:", response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ API Error:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      console.log("📦 Received data:", data)

      if (data.success === false) {
        throw new Error(data.error || "Failed to fetch orders")
      }

      const fetchedOrders = data.orders || []
      console.log(`✅ Successfully fetched ${fetchedOrders.length} orders`)

      setOrders(fetchedOrders)
    } catch (err) {
      console.error("💥 Error fetching orders:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch orders"
      setError(errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const getStatusBadgeVariant = (status: string) => {
    const lowerStatus = status?.toLowerCase() || ""
    if (lowerStatus.includes("completed") || lowerStatus.includes("finished")) {
      return "default"
    }
    if (lowerStatus.includes("progress") || lowerStatus.includes("working")) {
      return "secondary"
    }
    if (lowerStatus.includes("new") || lowerStatus.includes("pending")) {
      return "outline"
    }
    return "outline"
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("cs-CZ", {
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Historie oprav</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Historie oprav</h2>
          <Button
            onClick={() => fetchOrders()}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Obnovit
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                <strong>Chyba při načítání objednávek:</strong>
              </p>
              <p className="text-sm">{error}</p>
              <Button onClick={() => fetchOrders()} variant="outline" size="sm" className="mt-2">
                Zkusit znovu
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historie oprav</h2>
          <p className="text-muted-foreground">
            {orders.length === 0 ? "Zatím nemáte žádné objednávky" : `Celkem ${orders.length} objednávek`}
          </p>
        </div>
        <Button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Obnovit
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Žádné objednávky</h3>
            <p className="text-muted-foreground text-center">
              Zatím nemáte žádné objednávky oprav. Když si objednáte opravu, zobrazí se zde její průběh a historie.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <span>Objednávka #{order.documentId}</span>
                      <Badge variant={getStatusBadgeVariant(order.status || order.overallStatus || "")}>
                        {order.statusName || order.overallStatusName || order.status || order.overallStatus}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(order.createdAt || order.creationDate || "")}
                      </span>
                      {(order.deviceSerial || order.deviceSerialNumber) && (
                        <span className="flex items-center gap-1">
                          <Smartphone className="h-4 w-4" />
                          {order.deviceSerial || order.deviceSerialNumber}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Device Info */}
                <div className="flex items-center gap-2 text-sm">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.deviceName}</span>
                  {order.deviceBrand && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span>{order.deviceBrand}</span>
                    </>
                  )}
                  {order.deviceModel && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span>{order.deviceModel}</span>
                    </>
                  )}
                </div>

                {/* Services */}
                {order.services && order.services.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Služby:</h4>
                      <div className="space-y-2">
                        {order.services.map((service, index) => (
                          <div
                            key={service.id || index}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{service.name}</span>
                                {service.status && (
                                  <Badge variant="outline" className="text-xs">
                                    {service.statusName || service.status}
                                  </Badge>
                                )}
                              </div>
                              {service.warrantyPeriod && service.warrantyPeriod > 0 && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Záruka: {service.warrantyPeriod} {service.warrantyUnits || "dní"}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(service.price)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
