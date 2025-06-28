"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, Save, Eye, EyeOff } from "lucide-react"
import type { CookieSettings } from "@/types/cookie-consent"

export function CookieSettingsManager() {
  const t = useTranslations("admin.cookieSettings")
  const [settings, setSettings] = useState<CookieSettings>({
    googleAnalyticsId: "",
    googleTagManagerId: "",
    facebookPixelId: "",
    cookieBannerEnabled: true,
    cookieConsentVersion: "1.0",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showIds, setShowIds] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/cookie-settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching cookie settings:", error)
      toast.error("Failed to load cookie settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/cookie-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Cookie settings saved successfully")
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving cookie settings:", error)
      toast.error("Failed to save cookie settings")
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (key: keyof CookieSettings, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  if (isLoading) {
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
        <CardTitle className="flex items-center justify-between">
          {t("title")}
          <Button variant="outline" size="sm" onClick={() => setShowIds(!showIds)}>
            {showIds ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showIds ? "Hide IDs" : "Show IDs"}
          </Button>
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Cookie Banner Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Cookie Banner</h3>

          <div className="flex items-center space-x-2">
            <Switch
              id="cookieBannerEnabled"
              checked={settings.cookieBannerEnabled}
              onCheckedChange={(checked) => updateSetting("cookieBannerEnabled", checked)}
            />
            <Label htmlFor="cookieBannerEnabled">Enable Cookie Banner</Label>
          </div>
        </div>

        <Separator />

        {/* Analytics Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Analytics Services</h3>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="googleAnalyticsId">Google Analytics 4 Property ID</Label>
              <Input
                id="googleAnalyticsId"
                type={showIds ? "text" : "password"}
                placeholder="G-XXXXXXXXXX"
                value={settings.googleAnalyticsId || ""}
                onChange={(e) => updateSetting("googleAnalyticsId", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Find this in Google Analytics → Admin → Property Settings</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleTagManagerId">Google Tag Manager Container ID</Label>
              <Input
                id="googleTagManagerId"
                type={showIds ? "text" : "password"}
                placeholder="GTM-XXXXXXX"
                value={settings.googleTagManagerId || ""}
                onChange={(e) => updateSetting("googleTagManagerId", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Find this in Google Tag Manager → Container Settings</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Marketing Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Marketing Services</h3>

          <div className="space-y-2">
            <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
            <Input
              id="facebookPixelId"
              type={showIds ? "text" : "password"}
              placeholder="1234567890123456"
              value={settings.facebookPixelId || ""}
              onChange={(e) => updateSetting("facebookPixelId", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Find this in Facebook Business Manager → Events Manager</p>
          </div>
        </div>

        <Separator />

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Cookie Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
