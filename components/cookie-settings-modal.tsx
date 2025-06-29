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
    console.log("Saving cookie settings:", localConsent)

    // Зберігаємо поточні локальні налаштування
    Object.entries(localConsent).forEach(([category, value]) => {
      updateCategory(category as keyof typeof consent, value)
    })

    setTimeout(() => {
      saveCurrentSettings()
      onOpenChange(false)
    }, 100)
  }

  const handleReset = () => {
    console.log("Resetting all cookie settings")
    resetConsent()
    onOpenChange(false)
  }

  const handleLocalUpdate = (category: keyof typeof consent, value: boolean) => {
    setLocalConsent((prev) => ({
      ...prev,
      [category]: category === "necessary" ? true : value,
    }))
  }

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    }
    setLocalConsent(allAccepted)

    Object.entries(allAccepted).forEach(([category, value]) => {
      updateCategory(category as keyof typeof consent, value)
    })

    setTimeout(() => {
      saveCurrentSettings()
      onOpenChange(false)
    }, 100)
  }

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
    }
    setLocalConsent(onlyNecessary)

    Object.entries(onlyNecessary).forEach(([category, value]) => {
      updateCategory(category as keyof typeof consent, value)
    })

    setTimeout(() => {
      saveCurrentSettings()
      onOpenChange(false)
    }, 100)
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
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={handleRejectAll} className="flex-1 bg-transparent">
              Відхилити всі
            </Button>
            <Button onClick={handleAcceptAll} className="flex-1 bg-green-600 hover:bg-green-700">
              Прийняти всі
            </Button>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
            >
              Скинути всі
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Зберегти налаштування
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
