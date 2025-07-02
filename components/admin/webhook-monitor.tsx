"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Trash2, Globe, Clock, User, FileText, AlertCircle } from "lucide-react"

interface WebhookLog {
  id: number
  method: string
  url: string
  headers: Record<string, any>
  raw_body: string
  payload: any
  user_agent: string
  content_type: string
  created_at: string
}

interface WebhookLogsResponse {
  logs: WebhookLog[]
  total: number
  limit: number
  offset: number
}

export function WebhookMonitor() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLogs = async () => {
    try {
      setError(null)
      const response = await fetch("/api/admin/webhook-logs?limit=50")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: WebhookLogsResponse = await response.json()
      setLogs(data.logs || [])
    } catch (err) {
      console.error("Error fetching webhook logs:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch logs")
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    try {
      const response = await fetch("/api/admin/webhook-logs", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setLogs([])
      setSelectedLog(null)
    } catch (err) {
      console.error("Error clearing logs:", err)
      setError(err instanceof Error ? err.message : "Failed to clear logs")
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchLogs, 3000) // Refresh every 3 seconds
    return () => clearInterval(interval)
  }, [autoRefresh])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("cs-CZ")
  }

  const getMethodBadgeVariant = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "secondary"
      case "POST":
        return "default"
      case "PUT":
        return "outline"
      case "DELETE":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2)
    } catch {
      return String(obj)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Webhook Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Webhook Monitor
                {autoRefresh && (
                  <Badge variant="secondary" className="ml-2">
                    Live
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Real-time monitoring of incoming webhooks ({logs.length} total)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
                {autoRefresh ? "Pause" : "Resume"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLogs}
                className="flex items-center gap-2 bg-transparent"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="destructive" size="sm" onClick={clearLogs} className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No webhooks received</h3>
              <p className="text-muted-foreground">Webhooks will appear here when they are received</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Logs List */}
              <div className="space-y-2">
                <h3 className="font-semibold mb-3">Recent Webhooks</h3>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <Card
                        key={log.id}
                        className={`cursor-pointer transition-colors ${
                          selectedLog?.id === log.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={getMethodBadgeVariant(log.method)}>{log.method}</Badge>
                              <span className="text-sm font-mono">{log.url?.split("/").pop() || "webhook"}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(log.created_at)}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1 mb-1">
                              <User className="h-3 w-3" />
                              {log.user_agent || "Unknown"}
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {log.content_type || "Unknown"}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Log Details */}
              <div>
                <h3 className="font-semibold mb-3">Webhook Details</h3>
                {selectedLog ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Badge variant={getMethodBadgeVariant(selectedLog.method)}>{selectedLog.method}</Badge>
                          <span className="text-sm">#{selectedLog.id}</span>
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatDate(selectedLog.created_at)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="payload" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="payload">Payload</TabsTrigger>
                          <TabsTrigger value="headers">Headers</TabsTrigger>
                          <TabsTrigger value="raw">Raw Body</TabsTrigger>
                          <TabsTrigger value="meta">Metadata</TabsTrigger>
                        </TabsList>

                        <TabsContent value="payload" className="mt-4">
                          <ScrollArea className="h-[400px]">
                            <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                              {formatJson(selectedLog.payload)}
                            </pre>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="headers" className="mt-4">
                          <ScrollArea className="h-[400px]">
                            <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                              {formatJson(selectedLog.headers)}
                            </pre>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="raw" className="mt-4">
                          <ScrollArea className="h-[400px]">
                            <pre className="text-xs bg-muted p-4 rounded overflow-auto whitespace-pre-wrap">
                              {selectedLog.raw_body || "No raw body"}
                            </pre>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="meta" className="mt-4">
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">URL</label>
                              <p className="text-sm text-muted-foreground font-mono">{selectedLog.url}</p>
                            </div>
                            <Separator />
                            <div>
                              <label className="text-sm font-medium">User Agent</label>
                              <p className="text-sm text-muted-foreground">
                                {selectedLog.user_agent || "Not provided"}
                              </p>
                            </div>
                            <Separator />
                            <div>
                              <label className="text-sm font-medium">Content Type</label>
                              <p className="text-sm text-muted-foreground">
                                {selectedLog.content_type || "Not provided"}
                              </p>
                            </div>
                            <Separator />
                            <div>
                              <label className="text-sm font-medium">Timestamp</label>
                              <p className="text-sm text-muted-foreground">{formatDate(selectedLog.created_at)}</p>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Select a webhook</h3>
                        <p className="text-muted-foreground">Click on a webhook from the list to view its details</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
