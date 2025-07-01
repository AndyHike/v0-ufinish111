"use client"

import type React from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { useTranslations } from "next-intl"

/* -------------------------------------------------------------------------- */
/*                              Types & helpers                               */
/* -------------------------------------------------------------------------- */

type OrderStatus = "new" | "accepted" | "done-success" | "done-fail"

interface OrderService {
  id: string
  name: string
  price: number
  warrantyMonths: number
  status: OrderStatus
}

interface Order {
  id: string
  createdAt: string
  serialNumber: string
  deviceName: string
  services: OrderService[]
}

function getStatusBadgeVariant(status: OrderStatus): React.ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "done-success":
      return "success"
    case "done-fail":
      return "destructive"
    case "accepted":
      return "secondary"
    default:
      return "outline"
  }
}

function getStatusLabel(status: OrderStatus, t: ReturnType<typeof useTranslations>) {
  switch (status) {
    case "new":
      return t("status.new")
    case "accepted":
      return t("status.accepted")
    case "done-success":
      return t("status.success")
    case "done-fail":
      return t("status.fail")
    default:
      return status
  }
}

/* -------------------------------------------------------------------------- */
/*                               Mocked Orders                                */
/* -------------------------------------------------------------------------- */

const mockOrders: Order[] = [
  {
    id: "RO-1001",
    createdAt: "2025-06-01T10:30:00Z",
    serialNumber: "SN-X5S9-22",
    deviceName: "iPhone 14 Pro",
    services: [
      { id: "srv1", name: "Заміна дисплея", price: 2500, warrantyMonths: 3, status: "done-success" },
      { id: "srv2", name: "Діагностика", price: 300, warrantyMonths: 1, status: "done-success" },
    ],
  },
  {
    id: "RO-1002",
    createdAt: "2025-06-15T14:45:00Z",
    serialNumber: "SN-A1B2-88",
    deviceName: "Samsung Galaxy S23",
    services: [{ id: "srv3", name: "Заміна батареї", price: 1800, warrantyMonths: 6, status: "accepted" }],
  },
]

/* -------------------------------------------------------------------------- */
/*                              Main Component                                */
/* -------------------------------------------------------------------------- */

export function UserOrderHistory() {
  const t = useTranslations("OrderHistory")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title", { count: mockOrders.length })}</CardTitle>
      </CardHeader>
      <CardContent>
        {mockOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {mockOrders.map((order) => {
              const totalSum = order.services.reduce((sum, s) => sum + s.price, 0)

              return (
                <AccordionItem key={order.id} value={order.id} className="border-b">
                  <AccordionTrigger className="py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full text-left">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {order.deviceName} <span className="text-muted-foreground">({order.serialNumber})</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("orderId")}: {order.id} •{" "}
                          {format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", {
                            locale: uk,
                          })}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0 flex items-center gap-4">
                        <p className="font-semibold">{totalSum} ₴</p>
                        {/* Show status of the ENTIRE order as status of the last service */}
                        <Badge variant={getStatusBadgeVariant(order.services.at(-1)!.status)}>
                          {getStatusLabel(order.services.at(-1)!.status, t)}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Separator className="my-4" />
                    <ScrollArea className="max-h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("service")}</TableHead>
                            <TableHead className="text-right">{t("price")}</TableHead>
                            <TableHead className="text-center">{t("warranty")}</TableHead>
                            <TableHead className="text-center">{t("status")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.services.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell>{s.name}</TableCell>
                              <TableCell className="text-right">{s.price.toLocaleString()} ₴</TableCell>
                              <TableCell className="text-center">
                                {s.warrantyMonths} {t("months")}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={getStatusBadgeVariant(s.status)}>{getStatusLabel(s.status, t)}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}

export default UserOrderHistory
