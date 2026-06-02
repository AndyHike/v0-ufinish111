"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  FileText,
  ReceiptText,
  RefreshCw,
  Smartphone,
  Wrench,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

interface InvoiceOrder {
  id: string | null
  remonlineOrderId: number
  documentId: string | null
  creationDate: string | null
  deviceName: string | null
  deviceBrand: string | null
  deviceModel: string | null
  totalAmount: number
  overallStatus: string | null
  overallStatusName: string | null
  overallStatusColor: string | null
}

interface Invoice {
  id: string
  remonlineInvoiceId: number
  number: string
  statusId: number | null
  statusName: string | null
  statusGroup: string | null
  issueDate: string | null
  dueDate: string | null
  paymentMethod: string | null
  clientName: string | null
  payerName: string | null
  managerName: string | null
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  currency: string | null
  updatedAt: string | null
  orders: InvoiceOrder[]
}

function isSettled(invoice: Invoice) {
  if (invoice.balanceAmount <= 0 && invoice.totalAmount > 0) return true
  const status = `${invoice.statusName || ""} ${invoice.statusGroup || ""}`.toLowerCase()
  return /paid|paid_off|closed|оплач|uhrazen|zaplacen/.test(status)
}

function formatDate(value: string | null, locale: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : locale === "en" ? "en-US" : "cs-CZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function InvoiceStatusBadge({ invoice }: { invoice: Invoice }) {
  const t = useTranslations("invoices")
  const settled = isSettled(invoice)

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 rounded-md border px-2.5 text-xs font-medium",
        settled
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {invoice.statusName || (settled ? t("paidStatus") : t("openStatus"))}
    </Badge>
  )
}

function InvoiceAmountSummary({ invoice }: { invoice: Invoice }) {
  const t = useTranslations("invoices")

  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-lg border bg-background text-center">
      <div className="min-w-0 px-2.5 py-3">
        <div className="truncate text-[11px] font-medium uppercase text-muted-foreground">{t("total")}</div>
        <div className="mt-1 truncate text-sm font-semibold text-foreground">{formatCurrency(invoice.totalAmount)}</div>
      </div>
      <div className="min-w-0 border-x px-2.5 py-3">
        <div className="truncate text-[11px] font-medium uppercase text-muted-foreground">{t("paid")}</div>
        <div className="mt-1 truncate text-sm font-semibold text-emerald-700">{formatCurrency(invoice.paidAmount)}</div>
      </div>
      <div className="min-w-0 px-2.5 py-3">
        <div className="truncate text-[11px] font-medium uppercase text-muted-foreground">{t("balance")}</div>
        <div
          className={cn(
            "mt-1 truncate text-sm font-semibold",
            invoice.balanceAmount > 0 ? "text-amber-700" : "text-muted-foreground",
          )}
        >
          {formatCurrency(invoice.balanceAmount)}
        </div>
      </div>
    </div>
  )
}

function LinkedRepairOrders({ orders }: { orders: InvoiceOrder[] }) {
  const t = useTranslations("invoices")

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-background px-3 py-3 text-sm text-muted-foreground">
        {t("noLinkedOrders")}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
        <Wrench className="h-3.5 w-3.5" />
        {t("linkedOrders", { count: orders.length })}
      </div>
      <div className="space-y-2">
        {orders.map((order) => (
          <div
            key={`${order.remonlineOrderId}-${order.id || "pending"}`}
            className="flex flex-col gap-2 rounded-lg border bg-background px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">
                  #{order.documentId || order.remonlineOrderId}
                </span>
                {order.overallStatusName && (
                  <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[11px] font-medium">
                    {order.overallStatusName}
                  </Badge>
                )}
              </div>
              <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {order.deviceName || t("unknownDevice")}
                  {order.deviceBrand ? ` · ${order.deviceBrand}` : ""}
                  {order.deviceModel ? ` ${order.deviceModel}` : ""}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-sm font-semibold text-foreground sm:text-right">
              {formatCurrency(order.totalAmount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function UserInvoices() {
  const t = useTranslations("invoices")
  const params = useParams()
  const locale = (params.locale as string) || "uk"
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set())

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/user/invoices")
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || t("fetchError"))
      }

      setInvoices(data.invoices || [])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : t("fetchError"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const totals = useMemo(
    () =>
      invoices.reduce(
        (acc, invoice) => ({
          total: acc.total + invoice.totalAmount,
          balance: acc.balance + Math.max(invoice.balanceAmount, 0),
        }),
        { total: 0, balance: 0 },
      ),
    [invoices],
  )

  const toggleInvoice = (invoiceId: string) => {
    setExpandedInvoices((current) => {
      const next = new Set(current)
      if (next.has(invoiceId)) {
        next.delete(invoiceId)
      } else {
        next.add(invoiceId)
      }
      return next
    })
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
            <Button variant="outline" onClick={fetchInvoices} className="bg-background">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("tryAgain")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20 shadow-sm">
        <CardContent className="flex items-center justify-center py-14">
          <div className="max-w-sm space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-background ring-1 ring-border">
              <ReceiptText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{t("noInvoices")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("noInvoicesDescription")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:min-w-72">
          <div className="rounded-lg border bg-background px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CircleDollarSign className="h-3.5 w-3.5" />
              {t("total")}
            </div>
            <div className="mt-1 truncate font-semibold">{formatCurrency(totals.total)}</div>
          </div>
          <div className="rounded-lg border bg-background px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Banknote className="h-3.5 w-3.5" />
              {t("balance")}
            </div>
            <div className="mt-1 truncate font-semibold text-amber-700">{formatCurrency(totals.balance)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {invoices.map((invoice) => {
          const expanded = expandedInvoices.has(invoice.id)
          const issuedAt = formatDate(invoice.issueDate, locale)
          const dueAt = formatDate(invoice.dueDate, locale)

          return (
            <Card key={invoice.id} className="overflow-hidden border-0 shadow-sm ring-1 ring-border/60">
              <button
                type="button"
                onClick={() => toggleInvoice(invoice.id)}
                className="flex w-full flex-col gap-4 p-4 text-left transition-colors hover:bg-muted/30 sm:p-5"
                aria-expanded={expanded}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <FileText className="h-5 w-5 shrink-0 text-primary" />
                      <span className="truncate">#{invoice.number}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {issuedAt && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {issuedAt}
                        </span>
                      )}
                      {dueAt && <span>{t("dueDate", { date: dueAt })}</span>}
                      {invoice.orders.length > 0 && <span>{t("linkedOrders", { count: invoice.orders.length })}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <InvoiceStatusBadge invoice={invoice} />
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <InvoiceAmountSummary invoice={invoice} />
              </button>

              {expanded && (
                <div className="border-t bg-muted/10 p-4 sm:p-5">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
                    <LinkedRepairOrders orders={invoice.orders} />
                    <div className="rounded-lg border bg-background px-3 py-3 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">{t("paymentMethod")}</span>
                          <span className="text-right font-medium">{invoice.paymentMethod || t("notSpecified")}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">{t("payer")}</span>
                          <span className="text-right font-medium">
                            {invoice.payerName || invoice.clientName || t("notSpecified")}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">{t("updated")}</span>
                          <span className="text-right font-medium">
                            {formatDate(invoice.updatedAt, locale) || t("notSpecified")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default UserInvoices
