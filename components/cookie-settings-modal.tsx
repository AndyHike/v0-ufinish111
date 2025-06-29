"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCookieConsentContext } from "@/contexts/cookie-consent-context"

interface CookieSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CookieSettingsModal({ open, onOpenChange }: CookieSettingsModalProps) {
  const { consent, updateCategory, saveCurrentSettings, resetConsent } = useCookieConsentContext()
  const [localConsent, setLocalConsent] = useState(consent)

  useEffect(() => {
    setLocalConsent(consent)
  }, [consent, open])

  const handleSave = () => {
    // Оновлюємо кожну категорію окремо
    Object.entries(localConsent).forEach(([category, value]) => {
      updateCategory(category as keyof typeof consent, value)
    })

    // Зберігаємо налаштування
    setTimeout(() => {
      saveCurrentSettings()
      onOpenChange(false)
      console.log("Cookie settings saved:", localConsent)
    }, 100)
  }

  const handleReset = () => {
    resetConsent()
    onOpenChange(false)
    console.log("Cookie settings reset")
  }

  const handleLocalUpdate = (category: keyof typeof consent, value: boolean) => {
    setLocalConsent((prev) => ({
      ...prev,
      [category]: category === "necessary" ? true : value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Налаштування cookies</DialogTitle>
          <DialogDescription>
            Керуйте своїми налаштуваннями cookies. Ви можете змінити свої налаштування в будь-який час.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="necessary" className="text-sm font-medium">
                  Необхідні cookies
                </Label>
                <p className="text-xs text-gray-500">
                  Ці cookies необхідні для роботи сайту і не можуть бути відключені.
                </p>
              </div>
              <Switch id="necessary" checked={true} disabled={true} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="analytics" className="text-sm font-medium">
                  Аналітичні cookies
                </Label>
                <p className="text-xs text-gray-500">Допомагають нам зрозуміти, як відвідувачі взаємодіють з сайтом.</p>
              </div>
              <Switch
                id="analytics"
                checked={localConsent.analytics}
                onCheckedChange={(checked) => handleLocalUpdate("analytics", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="marketing" className="text-sm font-medium">
                  Маркетингові cookies
                </Label>
                <p className="text-xs text-gray-500">Використовуються для показу релевантної реклами.</p>
              </div>
              <Switch
                id="marketing"
                checked={localConsent.marketing}
                onCheckedChange={(checked) => handleLocalUpdate("marketing", checked)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto bg-transparent">
            Скинути всі
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              Скасувати
            </Button>
            <Button onClick={handleSave} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700">
              Зберегти
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
