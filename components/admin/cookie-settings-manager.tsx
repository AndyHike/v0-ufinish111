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
import { Loader2, Save, Eye, EyeOff, CheckCircle } from "lucide-react"

interface CookieSettings {
  googleAnalyticsId: string
  googleTagManagerId: string
  facebookPixelId: string
  cookieBannerEnabled: boolean
  cookieConsentVersion: string
}

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
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/cookie-settings")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched settings:", data)
      setSettings(data)
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
      console.log("Saving settings:", settings)

      const response = await fetch("/api/admin/cookie-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      const result = await response.json()
      console.log("Save response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to save settings")
      }

      setLastSaved(new Date())
      toast.success("Cookie settings saved successfully!")
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
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading cookie settings...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Cookie & Analytics Settings
          <div className="flex items-center gap-2">
            {lastSaved && (
              <div className="flex items-center text-sm text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowIds(!showIds)}>
              {showIds ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showIds ? "Hide IDs" : "Show IDs"}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Configure analytics and marketing services. Services will only load when users consent to cookies.
        </CardDescription>
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
              <p className="text-xs text-muted-foreground">
                Find this in Google Analytics → Admin → Property Settings → Property Details
              </p>
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
