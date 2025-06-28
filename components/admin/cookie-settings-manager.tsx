"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Save, Eye, EyeOff, TestTube } from "lucide-react"

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
      } else {
        toast.error("Failed to load cookie settings")
      }
    } catch (error) {
      toast.error("Error loading cookie settings")
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
        toast.success("Cookie settings saved successfully!")
      } else {
        const errorData = await response.json()
        toast.error(`Error: ${errorData.error || "Failed to save settings"}`)
      }
    } catch (error) {
      toast.error("Error saving cookie settings")
    } finally {
      setIsSaving(false)
    }
  }

  const testGoogleAnalytics = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "test_event", {
        event_category: "admin_test",
        event_label: "manual_test",
        value: 1,
      })
      toast.success("Test event sent to Google Analytics!")
    } else {
      toast.error("Google Analytics not loaded. Make sure you've accepted analytics cookies.")
    }
  }

  const updateSetting = (key: keyof CookieSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
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
          <Button variant="outline" size="sm" onClick={() => setShowIds(!showIds)}>
            {showIds ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showIds ? "Hide IDs" : "Show IDs"}
          </Button>
        </CardTitle>
        <CardDescription>Configure cookie consent banner and analytics tracking services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cookie Banner Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Cookie Banner</h3>
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
        </div>

        <Separator />

        {/* Google Analytics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Google Analytics</h3>
            <div className="flex items-center gap-2">
              <Badge variant={settings.google_analytics_id ? "default" : "secondary"}>
                {settings.google_analytics_id ? "Configured" : "Not Set"}
              </Badge>
              {settings.google_analytics_id && (
                <Button variant="outline" size="sm" onClick={testGoogleAnalytics}>
                  <TestTube className="h-4 w-4 mr-1" />
                  Test
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ga-id">Google Analytics Measurement ID</Label>
            <Input
              id="ga-id"
              type={showIds ? "text" : "password"}
              placeholder="G-XXXXXXXXXX"
              value={settings.google_analytics_id}
              onChange={(e) => updateSetting("google_analytics_id", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find this in Google Analytics → Admin → Property Settings → Measurement ID
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Analytics Tracking</Label>
              <p className="text-sm text-muted-foreground">Default state for analytics cookies</p>
            </div>
            <Switch
              checked={settings.analytics_enabled}
              onCheckedChange={(checked) => updateSetting("analytics_enabled", checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Google Tag Manager */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Google Tag Manager</h3>
            <Badge variant={settings.google_tag_manager_id ? "default" : "secondary"}>
              {settings.google_tag_manager_id ? "Configured" : "Not Set"}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gtm-id">Google Tag Manager Container ID</Label>
            <Input
              id="gtm-id"
              type={showIds ? "text" : "password"}
              placeholder="GTM-XXXXXXX"
              value={settings.google_tag_manager_id}
              onChange={(e) => updateSetting("google_tag_manager_id", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find this in Google Tag Manager → Container Settings → Container ID
            </p>
          </div>
        </div>

        <Separator />

        {/* Facebook Pixel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Facebook Pixel</h3>
            <Badge variant={settings.facebook_pixel_id ? "default" : "secondary"}>
              {settings.facebook_pixel_id ? "Configured" : "Not Set"}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fb-pixel-id">Facebook Pixel ID</Label>
            <Input
              id="fb-pixel-id"
              type={showIds ? "text" : "password"}
              placeholder="1234567890123456"
              value={settings.facebook_pixel_id}
              onChange={(e) => updateSetting("facebook_pixel_id", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find this in Facebook Business Manager → Events Manager → Pixels
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Marketing Tracking</Label>
              <p className="text-sm text-muted-foreground">Default state for marketing cookies</p>
            </div>
            <Switch
              checked={settings.marketing_enabled}
              onCheckedChange={(checked) => updateSetting("marketing_enabled", checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Debug Information */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Debug Information</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>GA ID: {settings.google_analytics_id || "Not set"}</p>
            <p>Analytics Enabled: {settings.analytics_enabled ? "Yes" : "No"}</p>
            <p>Cookie Banner: {settings.cookie_banner_enabled ? "Enabled" : "Disabled"}</p>
          </div>
        </div>

        {/* Save Button */}
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
