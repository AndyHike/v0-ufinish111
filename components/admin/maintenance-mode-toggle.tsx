"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertTriangle } from "lucide-react"

interface MaintenanceModeToggleProps {
  initialEnabled?: boolean
  initialTitle?: string
  initialMessage?: string
  initialEstimatedCompletion?: string
}

export function MaintenanceModeToggle({
  initialEnabled = false,
  initialTitle = "Технічні роботи",
  initialMessage = "Наразі проводяться технічні роботи. Будь ласка, спробуйте пізніше.",
  initialEstimatedCompletion = "",
}: MaintenanceModeToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [title, setTitle] = useState(initialTitle)
  const [message, setMessage] = useState(initialMessage)
  const [estimatedCompletion, setEstimatedCompletion] = useState(initialEstimatedCompletion)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/maintenance-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: checked,
          title,
          message,
          estimated_completion: estimatedCompletion,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update maintenance mode")
      }

      setEnabled(checked)
      toast({
        title: checked ? "Режим технічних робіт увімкнено" : "Режим технічних робіт вимкнено",
        description: checked
          ? "Сайт тепер недоступний для звичайних користувачів"
          : "Сайт знову доступний для всіх користувачів",
      })
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

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/maintenance-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled,
          title,
          message,
          estimated_completion: estimatedCompletion,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save maintenance settings")
      }

      toast({
        title: "Налаштування збережено",
        description: "Налаштування режиму технічних робіт успішно оновлено",
      })
    } catch (error) {
      console.error("Error saving maintenance settings:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти налаштування",
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
          <AlertTriangle className="h-5 w-5" />
          Режим технічних робіт
        </CardTitle>
        <CardDescription>
          Увімкніть режим технічних робіт, щоб заблокувати доступ до сайту для звичайних користувачів
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch id="maintenance-mode" checked={enabled} onCheckedChange={handleToggle} disabled={isLoading} />
          <Label htmlFor="maintenance-mode" className="text-sm font-medium">
            {enabled ? "Режим технічних робіт увімкнено" : "Режим технічних робіт вимкнено"}
          </Label>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="maintenance-title">Заголовок</Label>
            <Input
              id="maintenance-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Технічні роботи"
            />
          </div>

          <div>
            <Label htmlFor="maintenance-message">Повідомлення</Label>
            <Textarea
              id="maintenance-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Наразі проводяться технічні роботи. Будь ласка, спробуйте пізніше."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="maintenance-eta">Очікуваний час завершення</Label>
            <Input
              id="maintenance-eta"
              type="datetime-local"
              value={estimatedCompletion}
              onChange={(e) => setEstimatedCompletion(e.target.value)}
            />
          </div>

          <Button onClick={handleSaveSettings} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Зберегти налаштування
          </Button>
        </div>

        {enabled && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-orange-800">Увага!</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Режим технічних робіт активний. Тільки адміністратори можуть отримати доступ до сайту.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
