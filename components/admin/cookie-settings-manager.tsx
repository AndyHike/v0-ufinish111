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
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/cookie-settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
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
        toast.success("Cookie settings saved successfully!")
      } else {
        const errorData = await response.json()
        toast.error(`Error saving cookie settings: ${errorData.error || "Unknown error"}`)
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

  if (isLoading) {
    return <div>Loading cookie settings...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cookie & Analytics Settings</CardTitle>
        <CardDescription>Configure cookie consent banner and analytics tracking services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cookie Banner Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Cookie Banner</h3>
          <div className="flex items-center space-x-2">
            <Switch
              id="cookie-banner"
              checked={settings.cookie_banner_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, cookie_banner_enabled: checked })}
            />
            <Label htmlFor="cookie-banner">Enable Cookie Consent Banner</Label>
          </div>
        </div>

        <Separator />

        {/* Google Analytics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Google Analytics</h3>
            <Badge variant={settings.google_analytics_id ? "default" : "secondary"}>
              {settings.google_analytics_id ? "Configured" : "Not Set"}
            </Badge>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ga-id">Google Analytics Measurement ID</Label>
            <div className="flex gap-2">
              <Input
                id="ga-id"
                placeholder="G-XXXXXXXXXX"
                value={settings.google_analytics_id}
                onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
              />
              <Button variant="outline" onClick={testGoogleAnalytics} disabled={!settings.google_analytics_id}>
                Test
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="analytics-enabled"
              checked={settings.analytics_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, analytics_enabled: checked })}
            />
            <Label htmlFor="analytics-enabled">Enable Analytics Tracking</Label>
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

          <div className="grid gap-2">
            <Label htmlFor="gtm-id">Google Tag Manager Container ID</Label>
            <Input
              id="gtm-id"
              placeholder="GTM-XXXXXXX"
              value={settings.google_tag_manager_id}
              onChange={(e) => setSettings({ ...settings, google_tag_manager_id: e.target.value })}
            />
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

          <div className="grid gap-2">
            <Label htmlFor="fb-pixel-id">Facebook Pixel ID</Label>
            <Input
              id="fb-pixel-id"
              placeholder="1234567890123456"
              value={settings.facebook_pixel_id}
              onChange={(e) => setSettings({ ...settings, facebook_pixel_id: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="marketing-enabled"
              checked={settings.marketing_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, marketing_enabled: checked })}
            />
            <Label htmlFor="marketing-enabled">Enable Marketing Tracking</Label>
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
          {isSaving ? "Saving..." : "Save Cookie Settings"}
        </Button>
      </CardContent>
    </Card>
  )
}
