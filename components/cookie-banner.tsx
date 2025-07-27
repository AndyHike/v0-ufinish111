"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Settings, X } from "lucide-react"
import { useCookieConsentContext } from "@/contexts/cookie-consent-context"
import { CookieSettingsModal } from "./cookie-settings-modal"

export function CookieBanner() {
  const t = useTranslations("cookies")
  const { showBanner, acceptAll, acceptNecessary, setShowBanner } = useCookieConsentContext()
  const [showSettings, setShowSettings] = useState(false)

  console.log("🎌 CookieBanner render:", { showBanner })

  if (!showBanner) return null

  const handleAcceptAll = () => {
    console.log("✅ User clicked Accept All")
    acceptAll()
  }

  const handleAcceptNecessary = () => {
    console.log("⚠️ User clicked Accept Necessary")
    acceptNecessary()
  }

  const handleShowSettings = () => {
    console.log("⚙️ User clicked Settings")
    setShowSettings(true)
  }

  const handleCloseBanner = () => {
    console.log("❌ User closed banner")
    setShowBanner(false)
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <Card className="mx-auto max-w-4xl">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-2">{t("banner.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("banner.description")}</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button variant="outline" size="sm" onClick={handleShowSettings} className="gap-2 bg-transparent">
                  <Settings className="h-4 w-4" />
                  {t("banner.customize")}
                </Button>

                <Button variant="outline" size="sm" onClick={handleAcceptNecessary}>
                  {t("banner.acceptNecessary")}
                </Button>

                <Button size="sm" onClick={handleAcceptAll}>
                  {t("banner.acceptAll")}
                </Button>

                <Button variant="ghost" size="sm" onClick={handleCloseBanner} className="p-2">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CookieSettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </>
  )
}
