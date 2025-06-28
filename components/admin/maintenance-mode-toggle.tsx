"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Settings } from "lucide-react"
import { toast } from "sonner"

export function MaintenanceModeToggle() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMaintenanceStatus()
  }, [])

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await fetch("/api/admin/maintenance-mode")
      if (response.ok) {
        const data = await response.json()
        setIsEnabled(data.enabled)
      }
    } catch (error) {
      console.error("Failed to fetch maintenance status:", error)
      toast.error("Помилка завантаження статусу технічних робіт")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMaintenanceMode = async (enabled: boolean) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/maintenance-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      })

      if (response.ok) {
        setIsEnabled(enabled)
        toast.success(enabled ? "Режим технічних робіт увімкнено" : "Режим технічних робіт вимкнено")
      } else {
        throw new Error("Failed to update maintenance mode")
      }
    } catch (error) {
      console.error("Failed to toggle maintenance mode:", error)
      toast.error("Помилка зміни режиму технічних робіт")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Режим технічних робіт
        </CardTitle>
        <CardDescription>Увімкніть для блокування доступу звичайних користувачів до сайту</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch
            id="maintenance-mode"
            checked={isEnabled}
            onCheckedChange={toggleMaintenanceMode}
            disabled={isLoading}
          />
          <Label htmlFor="maintenance-mode" className="flex items-center gap-2">
            {isEnabled && <AlertTriangle className="h-4 w-4 text-orange-500" />}
            {isEnabled ? "Увімкнено" : "Вимкнено"}
          </Label>
        </div>

        {isEnabled && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Увага: Сайт недоступний для звичайних користувачів</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
