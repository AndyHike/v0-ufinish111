"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCookieConsentContext } from "@/contexts/cookie-consent-context"

interface CookieSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CookieSettingsModal({ open, onOpenChange }: CookieSettingsModalProps) {
  const t = useTranslations("cookies")
  const { consent, updateCategory, saveCurrentSettings, acceptAll, acceptNecessary } = useCookieConsentContext()

  console.log("⚙️ CookieSettingsModal render:", { open, consent })

  const handleSave = () => {
    console.log("💾 User clicked Save in modal")
    saveCurrentSettings()
    onOpenChange(false)
  }

  const handleAcceptAll = () => {
    console.log("✅ User clicked Accept All in modal")
    acceptAll()
    onOpenChange(false)
  }

  const handleAcceptNecessary = () => {
    console.log("⚠️ User clicked Accept Necessary in modal")
    acceptNecessary()
    onOpenChange(false)
  }

  const cookieCategories = [
    {
      id: "necessary" as const,
      name: t("categories.necessary.name"),
      description: t("categories.necessary.description"),
      required: true,
      services: [t("categories.necessary.services.0"), t("categories.necessary.services.1")],
    },
    {
      id: "analytics" as const,
      name: t("categories.analytics.name"),
      description: t("categories.analytics.description"),
      required: false,
      services: [t("categories.analytics.services.0"), t("categories.analytics.services.1")],
    },
    {
      id: "marketing" as const,
      name: t("categories.marketing.name"),
      description: t("categories.marketing.description"),
      required: false,
      services: [t("categories.marketing.services.0"), t("categories.marketing.services.1")],
    },
  ]

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
                  <Label htmlFor={category.id} className="text-base font-medium">
                    {category.name}
                    {category.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <Switch
                  id={category.id}
                  checked={consent[category.id]}
                  onCheckedChange={(checked) => {
                    console.log(`🔄 Switch changed: ${category.id} = ${checked}`)
                    updateCategory(category.id, checked)
                  }}
                  disabled={category.required}
                />
              </div>

              <div className="ml-4 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t("settings.services")}:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {category.services.map((service, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                      {service}
                    </li>
                  ))}
                </ul>
              </div>

              {category.id !== "marketing" && <Separator />}
            </div>
          ))}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-4">
            <Button variant="outline" onClick={handleAcceptNecessary} className="w-full sm:w-auto bg-transparent">
              {t("settings.acceptNecessary")}
            </Button>
            <Button onClick={handleAcceptAll} className="w-full sm:w-auto">
              {t("settings.acceptAll")}
            </Button>
            <Button variant="secondary" onClick={handleSave} className="w-full sm:w-auto">
              {t("settings.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
