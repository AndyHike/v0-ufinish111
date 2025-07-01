"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Activity, Clock, CheckCircle, XCircle, AlertCircle, Copy } from "lucide-react"
import { toast } from "sonner"

interface WebhookLog {
  id: string
  event_type: string
  status: "received" | "success" | "failed" | "error"
  message: string
  processing_time_ms: number
  webhook_data: any
  created_at: string
}

export function WebhookMonitor() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/webhook-logs")
      const data = await response.json()

      if (response.ok) {
        setLogs(data.logs || [])
      } else {
        toast.error(`Failed to fetch logs: ${data.error}`)
      }
    } catch (error) {
      console.error("Error fetching webhook logs:", error)
      toast.error("Failed to fetch webhook logs")
    } finally {
      setIsLoading(false)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "received":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      failed: "destructive",
      error: "destructive",
      received: "secondary",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    toast.success("Copied to clipboard")
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Webhook Monitor
                {autoRefresh && <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />}
              </CardTitle>
              <CardDescription>Real-time monitoring of incoming webhooks from RemOnline</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? "Auto Refresh ON" : "Auto Refresh OFF"}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No webhook logs yet. Waiting for webhooks from RemOnline...</p>
              <p className="text-sm mt-2">
                Webhook URL:{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com"}/api/webhooks/remonline
                </code>
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <div key={log.id}>
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">{getStatusIcon(log.status)}</div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{log.event_type}</span>
                            {getStatusBadge(log.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(log.created_at)}
                            {log.processing_time_ms > 0 && <span>({log.processing_time_ms}ms)</span>}
                          </div>
                        </div>

                        {log.message && <p className="text-sm text-muted-foreground">{log.message}</p>}

                        {log.webhook_data && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Webhook Data:</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(log.webhook_data)}
                                className="text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(log.webhook_data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                    {index < logs.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Success</p>
                <p className="text-2xl font-bold">{logs.filter((log) => log.status === "success").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">
                  {logs.filter((log) => log.status === "failed" || log.status === "error").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Time</p>
                <p className="text-2xl font-bold">
                  {logs.length > 0
                    ? Math.round(logs.reduce((sum, log) => sum + log.processing_time_ms, 0) / logs.length)
                    : 0}
                  ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
