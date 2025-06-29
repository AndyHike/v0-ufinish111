"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Settings, Cookie } from "lucide-react"
import { useCookieConsentContext } from "@/contexts/cookie-consent-context"
import { CookieSettingsModal } from "./cookie-settings-modal"

export function CookieBanner() {
  const { showBanner, acceptAll, acceptNecessary, setShowBanner } = useCookieConsentContext()
  const [showSettings, setShowSettings] = useState(false)

  if (!showBanner) return null

  const handleAcceptAll = () => {
    console.log("User clicked Accept All")
    acceptAll()
  }

  const handleAcceptNecessary = () => {
    console.log("User clicked Accept Necessary")
    acceptNecessary()
  }

  const handleShowSettings = () => {
    setShowSettings(true)
  }

  const handleClose = () => {
    setShowBanner(false)
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm border-t shadow-lg">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Cookie className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Ми використовуємо cookies</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Цей сайт використовує cookies для покращення вашого досвіду користування. Необхідні cookies завжди
                    активні, але ви можете вибрати, чи дозволити аналітичні cookies для покращення нашого сервісу.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleAcceptAll} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Прийняти всі
                  </Button>
                  <Button onClick={handleAcceptNecessary} variant="outline">
                    Тільки необхідні
                  </Button>
                  <Button onClick={handleShowSettings} variant="ghost" className="text-gray-600 hover:text-gray-900">
                    <Settings className="h-4 w-4 mr-1" />
                    Налаштування
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <CookieSettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </>
  )
}
