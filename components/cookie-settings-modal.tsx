"use client"

import { useTranslations } from "next-intl"
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
import type { CookieCategoryInfo } from "@/types/cookie-consent"

interface CookieSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CookieSettingsModal({ open, onOpenChange }: CookieSettingsModalProps) {
  const t = useTranslations("cookies")
  const { consent, updateCategory, acceptAll, acceptNecessary, saveCurrentSettings } = useCookieConsentContext()

  const cookieCategories: CookieCategoryInfo[] = [
    {
      id: "necessary",
      name: t("categories.necessary.name"),
      description: t("categories.necessary.description"),
      required: true,
      services: [t("categories.necessary.services")],
    },
    {
      id: "marketing",
      name: t("categories.marketing.name"),
      description: t("categories.marketing.description"),
      required: false,
      services: ["Facebook Pixel"],
    },
  ]

  const handleSaveAndClose = () => {
    saveCurrentSettings()
    onOpenChange(false)
  }

  const handleAcceptAll = () => {
    acceptAll()
    onOpenChange(false)
  }

  const handleAcceptNecessary = () => {
    acceptNecessary()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
          <DialogDescription>{t("settings.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {cookieCategories.map((category) => (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    {category.name}
                    {category.required && (
                      <span className="ml-2 text-xs text-muted-foreground">({t("settings.required")})</span>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                  <div className="text-xs text-muted-foreground">
                    <strong>{t("settings.services")}:</strong> {category.services.join(", ")}
                  </div>
                </div>

                <Switch
                  checked={consent[category.id]}
                  onCheckedChange={(checked) => updateCategory(category.id, checked)}
                  disabled={category.required}
                />
              </div>

              {category.id !== "marketing" && <Separator />}
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleAcceptNecessary} className="w-full sm:w-auto bg-transparent">
            {t("settings.acceptNecessary")}
          </Button>

          <Button onClick={handleAcceptAll} className="w-full sm:w-auto">
            {t("settings.acceptAll")}
          </Button>

          <Button variant="secondary" onClick={handleSaveAndClose} className="w-full sm:w-auto">
            {t("settings.saveAndClose")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
