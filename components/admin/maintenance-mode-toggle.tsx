"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Settings, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MaintenanceSettings {
  enabled: boolean
  title: string
  message: string
  estimated_completion: string
}

export function MaintenanceModeToggle() {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    enabled: false,
    title: "Технічні роботи",
    message: "Наразі проводяться технічні роботи. Будь ласка, спробуйте пізніше.",
    estimated_completion: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/maintenance-mode")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching maintenance settings:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити налаштування технічних робіт",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/maintenance-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Успішно збережено",
          description: "Налаштування технічних робіт оновлено",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving maintenance settings:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти налаштування",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleMaintenance = async (enabled: boolean) => {
    const newSettings = { ...settings, enabled }
    setSettings(newSettings)

    try {
      const response = await fetch("/api/admin/maintenance-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        toast({
          title: enabled ? "Режим технічних робіт увімкнено" : "Режим технічних робіт вимкнено",
          description: enabled
            ? "Сайт тепер недоступний для звичайних користувачів"
            : "Сайт знову доступний для всіх користувачів",
        })
      } else {
        // Revert on error
        setSettings(settings)
        throw new Error("Failed to toggle maintenance mode")
      }
    } catch (error) {
      console.error("Error toggling maintenance mode:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося змінити режим технічних робіт",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Режим технічних робіт
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Режим технічних робіт
        </CardTitle>
        <CardDescription>
          Увімкніть режим технічних робіт, щоб тимчасово заблокувати доступ до сайту для звичайних користувачів
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${settings.enabled ? "text-orange-500" : "text-gray-400"}`} />
            <div>
              <Label htmlFor="maintenance-toggle" className="text-base font-medium">
                Режим технічних робіт
              </Label>
              <p className="text-sm text-muted-foreground">
                {settings.enabled ? "Сайт недоступний для користувачів" : "Сайт працює в звичайному режимі"}
              </p>
            </div>
          </div>
          <Switch id="maintenance-toggle" checked={settings.enabled} onCheckedChange={toggleMaintenance} />
        </div>

        {/* Settings Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              placeholder="Технічні роботи"
            />
          </div>

          <div>
            <Label htmlFor="message">Повідомлення</Label>
            <Textarea
              id="message"
              value={settings.message}
              onChange={(e) => setSettings({ ...settings, message: e.target.value })}
              placeholder="Наразі проводяться технічні роботи. Будь ласка, спробуйте пізніше."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="eta">Очікуваний час завершення</Label>
            <Input
              id="eta"
              type="datetime-local"
              value={settings.estimated_completion}
              onChange={(e) => setSettings({ ...settings, estimated_completion: e.target.value })}
            />
          </div>

          <Button onClick={saveSettings} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Збереження...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Зберегти налаштування
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
