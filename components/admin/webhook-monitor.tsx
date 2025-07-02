"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Database,
  Code,
  Globe,
  Server,
} from "lucide-react"
import { toast } from "sonner"

interface WebhookLog {
  id: number
  event_type: string
  status: "received" | "success" | "failed" | "error"
  message: string
  processing_time_ms: number
  webhook_data: any
  display_payload: any
  raw_body: string
  headers: Record<string, string>
  metadata: any
  created_at: string
}

export function WebhookMonitor() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set())
  const [lastFetchTime, setLastFetchTime] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [total, setTotal] = useState(0)

  const fetchLogs = async () => {
    try {
      console.log("🔄 Fetching webhook logs...")
      setError("")

      const response = await fetch("/api/admin/webhook-logs?limit=100")
      const data = await response.json()

      if (response.ok && data.success) {
        console.log(`✅ Fetched ${data.logs?.length || 0} logs`)
        setLogs(data.logs || [])
        setTotal(data.total || 0)
        setLastFetchTime(new Date().toLocaleTimeString())
      } else {
        console.error("❌ Failed to fetch logs:", data.error)
        setError(data.error || "Failed to fetch logs")
        toast.error(`Failed to fetch logs: ${data.error}`)
      }
    } catch (error) {
      console.error("💥 Error fetching webhook logs:", error)
      setError("Network error")
      toast.error("Network error fetching webhook logs")
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = async () => {
    if (!confirm("Are you sure you want to clear all webhook logs?")) {
      return
    }

    try {
      const response = await fetch("/api/admin/webhook-logs", {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setLogs([])
        setTotal(0)
        toast.success(data.message || "Webhook logs cleared")
      } else {
        toast.error(`Failed to clear logs: ${data.error}`)
      }
    } catch (error) {
      console.error("Error clearing logs:", error)
      toast.error("Error clearing logs")
    }
  }

  const toggleLogExpansion = (logId: number) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "received":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default" as const,
      failed: "destructive" as const,
      error: "destructive" as const,
      received: "secondary" as const,
    }
    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2)
    } catch {
      return String(obj)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    if (!isAutoRefresh) return

    const interval = setInterval(fetchLogs, 3000)
    return () => clearInterval(interval)
  }, [isAutoRefresh])

  const stats = {
    total: logs.length,
    success: logs.filter((log) => log.status === "success").length,
    failed: logs.filter((log) => log.status === "failed" || log.status === "error").length,
    received: logs.filter((log) => log.status === "received").length,
    avgProcessingTime:
      logs.length > 0 ? Math.round(logs.reduce((sum, log) => sum + log.processing_time_ms, 0) / logs.length) : 0,
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className={error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {error ? <XCircle className="h-5 w-5 text-red-600" /> : <Zap className="h-5 w-5 text-green-600" />}
              <div>
                <p className={`font-medium ${error ? "text-red-900" : "text-green-900"}`}>
                  {error ? "Connection Error" : "Webhook Endpoint Active"}
                </p>
                <p className={`text-sm ${error ? "text-red-700" : "text-green-700"}`}>
                  {error || "https://devicehelp.cz/api/webhooks/remonline"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm ${error ? "text-red-700" : "text-green-700"}`}>
                Last Update: {lastFetchTime || "Never"}
              </p>
              <p className={`text-xs ${error ? "text-red-600" : "text-green-600"}`}>Total Records: {total}</p>
              <div className={`flex items-center gap-1 ${error ? "text-red-600" : "text-green-600"}`}>
                {isAutoRefresh && !error && <RefreshCw className="h-3 w-3 animate-spin" />}
                <span className="text-xs">{isAutoRefresh ? "Live" : "Paused"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Received</p>
                <p className="text-2xl font-bold text-blue-600">{stats.received}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Success</p>
                <p className="text-2xl font-bold text-green-600">{stats.success}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Avg Time</p>
                <p className="text-2xl font-bold">{stats.avgProcessingTime}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhook Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Webhook Monitor
                {isAutoRefresh && !error && (
                  <Badge variant="outline" className="ml-2 animate-pulse">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    LIVE
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Real-time monitoring of all incoming webhook requests
                {error && <span className="text-red-600 ml-2">({error})</span>}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAutoRefresh(!isAutoRefresh)}>
                {isAutoRefresh ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Resume
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchLogs}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={clearLogs} disabled={logs.length === 0}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[700px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading webhook logs...</span>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">
                <XCircle className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">Connection Error</p>
                <p className="text-sm">{error}</p>
                <Button onClick={fetchLogs} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No webhooks received yet</p>
                <p className="text-sm">Webhooks sent to the endpoint will appear here automatically</p>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">Endpoint URL:</p>
                  <p className="text-xs text-blue-600 font-mono">https://devicehelp.cz/api/webhooks/remonline</p>
                  <p className="text-xs text-blue-600 mt-1">Method: POST</p>
                  <p className="text-xs text-blue-600">Content-Type: application/json</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <p className="font-medium">{log.event_type}</p>
                          <p className="text-sm text-muted-foreground">{formatTime(log.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(log.status)}
                        <Badge variant="outline">{log.processing_time_ms}ms</Badge>
                        <Button variant="ghost" size="sm" onClick={() => toggleLogExpansion(log.id)}>
                          {expandedLogs.has(log.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {log.message && <p className="text-sm text-muted-foreground mb-2">{log.message}</p>}

                    {expandedLogs.has(log.id) && (
                      <>
                        <Separator className="my-3" />
                        <Tabs defaultValue="payload" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="payload" className="flex items-center gap-1">
                              <Code className="h-3 w-3" />
                              Payload
                            </TabsTrigger>
                            <TabsTrigger value="headers" className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              Headers
                            </TabsTrigger>
                            <TabsTrigger value="raw" className="flex items-center gap-1">
                              <Server className="h-3 w-3" />
                              Raw Body
                            </TabsTrigger>
                            <TabsTrigger value="metadata" className="flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              Metadata
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="payload" className="mt-4">
                            <div>
                              <p className="text-sm font-medium mb-2">Parsed Payload:</p>
                              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                                {formatJson(log.display_payload)}
                              </pre>
                            </div>
                          </TabsContent>

                          <TabsContent value="headers" className="mt-4">
                            <div>
                              <p className="text-sm font-medium mb-2">HTTP Headers:</p>
                              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                                {formatJson(log.headers)}
                              </pre>
                            </div>
                          </TabsContent>

                          <TabsContent value="raw" className="mt-4">
                            <div>
                              <p className="text-sm font-medium mb-2">Raw Request Body:</p>
                              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                                {log.raw_body || "(empty)"}
                              </pre>
                            </div>
                          </TabsContent>

                          <TabsContent value="metadata" className="mt-4">
                            <div>
                              <p className="text-sm font-medium mb-2">Request Metadata:</p>
                              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                                {formatJson(log.metadata)}
                              </pre>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
