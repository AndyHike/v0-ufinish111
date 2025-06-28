"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function MaintenanceModeToggle() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchMaintenanceMode()
  }, [])

  const fetchMaintenanceMode = async () => {
    try {
      const response = await fetch("/api/admin/maintenance-mode")
      if (response.ok) {
        const data = await response.json()
        setIsEnabled(data.enabled)
      }
    } catch (error) {
      console.error("Error fetching maintenance mode:", error)
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
        toast({
          title: enabled ? "Режим технічних робіт увімкнено" : "Режим технічних робіт вимкнено",
          description: enabled
            ? "Тільки адміністратори можуть отримати доступ до сайту"
            : "Сайт знову доступний для всіх користувачів",
        })
      } else {
        throw new Error("Failed to update maintenance mode")
      }
    } catch (error) {
      console.error("Error updating maintenance mode:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося оновити режим технічних робіт",
        variant: "destructive",
      })
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
        <CardDescription>
          Увімкніть режим технічних робіт, щоб обмежити доступ до сайту тільки для адміністраторів
        </CardDescription>
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
            <p className="text-sm text-orange-800">
              <strong>Увага:</strong> Режим технічних робіт активний. Тільки адміністратори можуть отримати доступ до
              сайту.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
