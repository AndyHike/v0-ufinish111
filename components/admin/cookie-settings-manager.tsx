"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, Save, Settings } from "lucide-react"

interface CookieSettings {
  google_analytics_id: string
  google_tag_manager_id: string
  facebook_pixel_id: string
  cookie_banner_enabled: boolean
  analytics_enabled: boolean
  marketing_enabled: boolean
}

export function CookieSettingsManager() {
  const [settings, setSettings] = useState<CookieSettings>({
    google_analytics_id: "",
    google_tag_manager_id: "",
    facebook_pixel_id: "",
    cookie_banner_enabled: true,
    analytics_enabled: true,
    marketing_enabled: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/cookie-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Cookie settings saved successfully!")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to save cookie settings")
      }
    } catch (error) {
      console.error("Error saving cookie settings:", error)
      toast.error("Failed to save cookie settings")
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof CookieSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
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
          <Settings className="h-5 w-5" />
          Cookie & Analytics Settings
        </CardTitle>
        <CardDescription>Configure cookie consent and analytics tracking services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analytics Services */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Analytics Services</h3>

          <div className="space-y-2">
            <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
            <Input
              id="google_analytics_id"
              placeholder="G-XXXXXXXXXX"
              value={settings.google_analytics_id}
              onChange={(e) => updateSetting("google_analytics_id", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_tag_manager_id">Google Tag Manager ID</Label>
            <Input
              id="google_tag_manager_id"
              placeholder="GTM-XXXXXXX"
              value={settings.google_tag_manager_id}
              onChange={(e) => updateSetting("google_tag_manager_id", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
            <Input
              id="facebook_pixel_id"
              placeholder="1234567890123456"
              value={settings.facebook_pixel_id}
              onChange={(e) => updateSetting("facebook_pixel_id", e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* Cookie Banner Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Cookie Banner Settings</h3>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Cookie Banner</Label>
              <p className="text-sm text-muted-foreground">Show cookie consent banner to users</p>
            </div>
            <Switch
              checked={settings.cookie_banner_enabled}
              onCheckedChange={(checked) => updateSetting("cookie_banner_enabled", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Analytics Cookies Default</Label>
              <p className="text-sm text-muted-foreground">Default state for analytics cookies</p>
            </div>
            <Switch
              checked={settings.analytics_enabled}
              onCheckedChange={(checked) => updateSetting("analytics_enabled", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Cookies Default</Label>
              <p className="text-sm text-muted-foreground">Default state for marketing cookies</p>
            </div>
            <Switch
              checked={settings.marketing_enabled}
              onCheckedChange={(checked) => updateSetting("marketing_enabled", checked)}
            />
          </div>
        </div>

        <Separator />

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
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
