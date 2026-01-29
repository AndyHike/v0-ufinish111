"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, RefreshCw, Trash2, CheckCircle } from "lucide-react"
import { useTranslations } from "next-intl"

type CacheStatus = "idle" | "loading" | "success" | "error"

export function CacheManagementPanel() {
  const t = useTranslations("Admin")
  const { toast } = useToast()
  const [status, setStatus] = useState<CacheStatus>("idle")
  const [statusMessage, setStatusMessage] = useState<string>("")

  const handleRevalidate = async (type?: "brands" | "series" | "models") => {
    setStatus("loading")
    setStatusMessage("")

    try {
      const response = await fetch("/api/admin/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: type || null }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || "Revalidation failed")
      }

      const data = await response.json()
      setStatus("success")
      setStatusMessage(
        type
          ? `Кеш для "${type}" очищено`
          : "Весь кеш очищено успішно"
      )

      toast({
        title: "Успішно",
        description: statusMessage || "Кеш очищено",
      })

      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus("idle")
        setStatusMessage("")
      }, 3000)
    } catch (error) {
      setStatus("error")
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setStatusMessage(errorMessage)

      toast({
        title: "Помилка",
        description: errorMessage,
        variant: "destructive",
      })

      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus("idle")
        setStatusMessage("")
      }, 5000)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Управління Кешем
        </CardTitle>
        <CardDescription>
          Очистіть кеш сторінок для оновлення контенту
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Message */}
        {statusMessage && (
          <div
            className={`flex items-start gap-3 rounded-lg p-3 ${
              status === "success"
                ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"
            }`}
          >
            {status === "success" ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-sm">{statusMessage}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium mb-2">Очистити кеш по типам:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleRevalidate("brands")}
                disabled={status === "loading"}
                variant="outline"
                size="sm"
              >
                {status === "loading" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Бренди
              </Button>

              <Button
                onClick={() => handleRevalidate("series")}
                disabled={status === "loading"}
                variant="outline"
                size="sm"
              >
                {status === "loading" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Серії
              </Button>

              <Button
                onClick={() => handleRevalidate("models")}
                disabled={status === "loading"}
                variant="outline"
                size="sm"
              >
                {status === "loading" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Моделі
              </Button>
            </div>
          </div>

          <div className="border-t pt-3">
            <Button
              onClick={() => handleRevalidate()}
              disabled={status === "loading"}
              variant="destructive"
              size="sm"
            >
              {status === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Очистити ВСЕ
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Повна очистка кешу. Використовуйте лише якщо потрібно оновити все відразу.
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-1">💡 Як це працює:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Кеш автоматично оновлюється кожну годину (ISR)</li>
            <li>Натисніть на кнопку щоб оновити негайно</li>
            <li>Сторінки будуть перегенеровані на наступний запит</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
