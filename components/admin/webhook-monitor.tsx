"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Activity, CheckCircle, XCircle, AlertCircle, Clock, Trash2, RefreshCw, Eye, EyeOff, Zap } from "lucide-react"
import { toast } from "sonner"

interface WebhookLog {
  id: number
  event_type: string
  status: "received" | "success" | "failed" | "error"
  message: string
  processing_time_ms: number
  webhook_data: any
  created_at: string
}

export function WebhookMonitor() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set())
  const [lastFetchTime, setLastFetchTime] = useState<string>("")

  const fetchLogs = async () => {
    try {
      console.log("🔄 Fetching webhook logs...")
      const response = await fetch("/api/admin/webhook-logs?limit=100")
      const data = await response.json()

      if (response.ok) {
        console.log(`✅ Fetched ${data.logs?.length || 0} logs`)
        setLogs(data.logs || [])
        setLastFetchTime(new Date().toLocaleTimeString())
      } else {
        console.error("❌ Failed to fetch logs:", data.error)
        toast.error(`Failed to fetch logs: ${data.error}`)
      }
    } catch (error) {
      console.error("💥 Error fetching webhook logs:", error)
      toast.error("Error fetching webhook logs")
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = async () => {
    try {
      const response = await fetch("/api/admin/webhook-logs", {
        method: "DELETE",
      })

      if (response.ok) {
        setLogs([])
        toast.success("Webhook logs cleared")
      } else {
        const data = await response.json()
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

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    if (!isAutoRefresh) return

    const interval = setInterval(fetchLogs, 2000) // Refresh every 2 seconds for better real-time feel
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
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Webhook Endpoint Active</p>
                <p className="text-sm text-blue-700">https://devicehelp.cz/api/webhooks/remonline</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700">Last Update: {lastFetchTime}</p>
              <div className="flex items-center gap-1 text-blue-600">
                {isAutoRefresh && <RefreshCw className="h-3 w-3 animate-spin" />}
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
              <Activity className="h-4 w-4 text-blue-500" />
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
                Real-time Webhook Monitor
                {isAutoRefresh && (
                  <Badge variant="outline" className="ml-2 animate-pulse">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    LIVE
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>All incoming webhooks are captured and displayed here in real-time</CardDescription>
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
              <Button variant="outline" size="sm" onClick={clearLogs}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading webhook logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No webhooks received yet</p>
                <p className="text-sm">Send a webhook to https://devicehelp.cz/api/webhooks/remonline</p>
                <p className="text-xs mt-2 text-blue-600">All incoming requests will appear here automatically</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, index) => (
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
                        <div>
                          <p className="text-sm font-medium mb-2">Full Webhook Data:</p>
                          <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                            {JSON.stringify(log.webhook_data, null, 2)}
                          </pre>
                        </div>
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
