"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertTriangle } from "lucide-react"

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
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/maintenance-mode")
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings({
            enabled: data.settings.enabled === "true",
            title: data.settings.title || "Технічні роботи",
            message: data.settings.message || "Наразі проводяться технічні роботи. Будь ласка, спробуйте пізніше.",
            estimated_completion: data.settings.estimated_completion || "",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching maintenance settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/maintenance-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: settings.enabled.toString(),
          title: settings.title,
          message: settings.message,
          estimated_completion: settings.estimated_completion,
        }),
      })

      if (response.ok) {
        toast({
          title: "Налаштування збережено",
          description: "Режим технічних робіт оновлено",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти налаштування",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Режим технічних робіт
        </CardTitle>
        <CardDescription>
          Увімкніть режим технічних робіт, щоб обмежити доступ до сайту тільки для адміністраторів
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="maintenance-mode"
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enabled: checked }))}
          />
          <Label htmlFor="maintenance-mode" className="text-sm font-medium">
            {settings.enabled ? "Режим технічних робіт увімкнено" : "Режим технічних робіт вимкнено"}
          </Label>
        </div>

        {settings.enabled && (
          <div className="space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Увага: Сайт буде доступний тільки адміністраторам</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="maintenance-title">Заголовок сторінки технічних робіт</Label>
            <Input
              id="maintenance-title"
              value={settings.title}
              onChange={(e) => setSettings((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Технічні роботи"
            />
          </div>

          <div>
            <Label htmlFor="maintenance-message">Повідомлення для користувачів</Label>
            <Textarea
              id="maintenance-message"
              value={settings.message}
              onChange={(e) => setSettings((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Наразі проводяться технічні роботи..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="estimated-completion">Очікуваний час завершення (опціонально)</Label>
            <Input
              id="estimated-completion"
              type="datetime-local"
              value={settings.estimated_completion}
              onChange={(e) => setSettings((prev) => ({ ...prev, estimated_completion: e.target.value }))}
            />
          </div>
        </div>

        <Button onClick={saveSettings} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Зберегти налаштування
        </Button>
      </CardContent>
    </Card>
  )
}
