"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Wrench, AlertTriangle, Clock, Save } from "lucide-react"

interface MaintenanceSettings {
  enabled: boolean
  title: string
  message: string
  estimatedCompletion: string
}

export function MaintenanceModeToggle() {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    enabled: false,
    title: "Технічні роботи",
    message: "Наразі проводяться технічні роботи. Будь ласка, спробуйте пізніше.",
    estimatedCompletion: "",
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/maintenance-mode")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching maintenance settings:", error)
      toast.error("Помилка завантаження налаштувань")
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<MaintenanceSettings>) => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/maintenance-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        setSettings((prev) => ({ ...prev, ...newSettings }))
        toast.success("Налаштування збережено")
      } else {
        toast.error("Помилка збереження налаштувань")
      }
    } catch (error) {
      console.error("Error updating maintenance settings:", error)
      toast.error("Помилка збереження налаштувань")
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (enabled: boolean) => {
    await updateSettings({ enabled })
  }

  const handleSaveDetails = async () => {
    await updateSettings({
      title: settings.title,
      message: settings.message,
      estimatedCompletion: settings.estimatedCompletion,
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Режим технічних робіт
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Режим технічних робіт
        </CardTitle>
        <CardDescription>
          Увімкніть режим технічних робіт, щоб заблокувати доступ до сайту для звичайних користувачів
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${settings.enabled ? "text-orange-500" : "text-gray-400"}`} />
            <div>
              <Label htmlFor="maintenance-mode" className="text-base font-medium">
                Режим технічних робіт
              </Label>
              <p className="text-sm text-gray-500">
                {settings.enabled ? "Сайт заблоковано для користувачів" : "Сайт доступний для всіх"}
              </p>
            </div>
          </div>
          <Switch id="maintenance-mode" checked={settings.enabled} onCheckedChange={handleToggle} disabled={saving} />
        </div>

        {/* Settings Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              value={settings.title}
              onChange={(e) => setSettings((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Технічні роботи"
            />
          </div>

          <div>
            <Label htmlFor="message">Повідомлення</Label>
            <Textarea
              id="message"
              value={settings.message}
              onChange={(e) => setSettings((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Наразі проводяться технічні роботи..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="estimated-completion" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Очікуваний час завершення
            </Label>
            <Input
              id="estimated-completion"
              type="datetime-local"
              value={settings.estimatedCompletion}
              onChange={(e) => setSettings((prev) => ({ ...prev, estimatedCompletion: e.target.value }))}
            />
          </div>

          <Button onClick={handleSaveDetails} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Збереження..." : "Зберегти налаштування"}
          </Button>
        </div>

        {/* Warning */}
        {settings.enabled && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800">Увага!</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Режим технічних робіт активний. Тільки адміністратори можуть отримати доступ до сайту. Звичайні
                  користувачі будуть перенаправлені на сторінку технічних робіт.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
