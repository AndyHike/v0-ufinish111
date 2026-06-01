"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, RotateCw, Search, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"

type IssueStatus = "open" | "resolved" | "ignored"

type OrderSyncIssue = {
  id: string
  event_name: string | null
  remonline_order_id: number | null
  remonline_client_id: number | null
  status: IssueStatus
  reason: string | null
  details: string | null
  attempts: number | null
  last_seen_at: string | null
}

const statuses: IssueStatus[] = ["open", "resolved", "ignored"]

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message
  return fallback
}

export function RemonlineOrderSyncIssues() {
  const t = useTranslations("Admin.remonlineOrders")
  const { toast } = useToast()
  const [status, setStatus] = useState<IssueStatus>("open")
  const [issues, setIssues] = useState<OrderSyncIssue[]>([])
  const [manualOrderId, setManualOrderId] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncingOrderId, setSyncingOrderId] = useState<number | null>(null)
  const [ignoringIssueId, setIgnoringIssueId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadIssues = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/remonline/order-sync-issues?status=${status}`, {
          cache: "no-store",
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || t("loadError"))
        }

        setIssues(data.issues || [])
      } catch (loadError) {
        setError(getErrorMessage(loadError, t("loadError")))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [status, t],
  )

  useEffect(() => {
    void loadIssues()
  }, [loadIssues])

  async function syncOrder(orderId: number) {
    setSyncingOrderId(orderId)
    setError(null)

    try {
      const response = await fetch(`/api/admin/remonline/orders/${orderId}/sync`, {
        method: "POST",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || t("syncFailed"))
      }

      toast({
        title: t("syncCompleted"),
        description: `#${orderId}`,
      })
      setManualOrderId("")
      await loadIssues(true)
    } catch (syncError) {
      const message = getErrorMessage(syncError, t("syncFailed"))
      setError(message)
      toast({
        title: t("syncFailed"),
        description: message,
        variant: "destructive",
      })
    } finally {
      setSyncingOrderId(null)
    }
  }

  async function handleManualSync() {
    const orderId = Number(manualOrderId)
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setError(t("invalidOrderId"))
      return
    }

    await syncOrder(orderId)
  }

  async function ignoreOrderSyncIssue(issueId: string) {
    setIgnoringIssueId(issueId)
    setError(null)

    try {
      const response = await fetch(`/api/admin/remonline/order-sync-issues/${issueId}`, {
        method: "PATCH",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t("ignoreFailed"))
      }

      toast({
        title: t("ignored"),
      })
      await loadIssues(true)
    } catch (ignoreError) {
      const message = getErrorMessage(ignoreError, t("ignoreFailed"))
      setError(message)
      toast({
        title: t("ignoreFailed"),
        description: message,
        variant: "destructive",
      })
    } finally {
      setIgnoringIssueId(null)
    }
  }

  const statusLabel = (value: IssueStatus) => {
    if (value === "resolved") return t("statusResolved")
    if (value === "ignored") return t("statusIgnored")
    return t("statusOpen")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("manualSync")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={t("manualOrderId")}
                value={manualOrderId}
                onChange={(event) => setManualOrderId(event.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleManualSync}
              disabled={syncingOrderId !== null}
              className="sm:min-w-[170px]"
            >
              {syncingOrderId !== null ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCw className="mr-2 h-4 w-4" />
              )}
              {syncingOrderId !== null ? t("syncing") : t("syncNow")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{t("issues")}</CardTitle>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{issues.length}</Badge>
              {statusLabel(status)}
            </div>
          </div>
          <Button variant="outline" onClick={() => loadIssues(true)} disabled={refreshing || loading}>
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {refreshing ? t("refreshing") : t("refresh")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={status} onValueChange={(value) => setStatus(value as IssueStatus)}>
            <TabsList className="grid w-full grid-cols-3 sm:w-[420px]">
              {statuses.map((item) => (
                <TabsTrigger key={item} value={item}>
                  {statusLabel(item)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("error")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("orderId")}</TableHead>
                  <TableHead>{t("clientId")}</TableHead>
                  <TableHead>{t("reason")}</TableHead>
                  <TableHead>{t("details")}</TableHead>
                  <TableHead>{t("attempts")}</TableHead>
                  <TableHead>{t("lastSeen")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : issues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                      <CheckCircle2 className="mx-auto mb-2 h-5 w-5" />
                      {t("noIssues")}
                    </TableCell>
                  </TableRow>
                ) : (
                  issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-medium">
                        {issue.remonline_order_id ? `#${issue.remonline_order_id}` : t("notAvailable")}
                      </TableCell>
                      <TableCell>
                        {issue.remonline_client_id ? `#${issue.remonline_client_id}` : t("notAvailable")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={issue.status === "open" ? "destructive" : "secondary"}>
                          {issue.reason || t("notAvailable")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[320px] whitespace-normal text-sm text-muted-foreground">
                        {issue.details || issue.event_name || t("notAvailable")}
                      </TableCell>
                      <TableCell>{issue.attempts ?? 0}</TableCell>
                      <TableCell>{formatDate(issue.last_seen_at)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {issue.remonline_order_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => syncOrder(issue.remonline_order_id as number)}
                              disabled={syncingOrderId !== null}
                            >
                              {syncingOrderId === issue.remonline_order_id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCw className="mr-2 h-4 w-4" />
                              )}
                              {t("syncOrder")}
                            </Button>
                          )}
                          {issue.status === "open" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => ignoreOrderSyncIssue(issue.id)}
                              disabled={ignoringIssueId !== null}
                            >
                              {ignoringIssueId === issue.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                              )}
                              {t("ignore")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
