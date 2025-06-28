"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Loader2, TestTube } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [testingGA, setTestingGA] = useState(false)

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
      setMessage({ type: "error", text: "Failed to load settings" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/cookie-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Cookie settings saved successfully!" })
        // Перезавантажуємо аналітику без перезавантаження сторінки
        window.location.reload()
      } else {
        const errorData = await response.json()
        setMessage({ type: "error", text: `Error: ${errorData.error || "Failed to save settings"}` })
      }
    } catch (error) {
      setMessage({ type: "error", text: `Error saving cookie settings: ${error}` })
    } finally {
      setIsSaving(false)
    }
  }

  const testGoogleAnalytics = () => {
    setTestingGA(true)

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "test_event", {
        event_category: "admin_test",
        event_label: "manual_test",
        value: 1,
      })
      setMessage({ type: "success", text: "Test event sent to Google Analytics!" })
    } else {
      setMessage({
        type: "error",
        text: "GA not available. Make sure analytics consent is given and page is reloaded.",
      })
    }

    setTimeout(() => setTestingGA(false), 1000)
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
    <div className="space-y-6">
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
              <Label htmlFor="cookie-banner">Enable Cookie Banner</Label>
              {settings.cookie_banner_enabled ? (
                <Badge variant="default">Enabled</Badge>
              ) : (
                <Badge variant="secondary">Disabled</Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Analytics Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Analytics Services</h3>

            <div className="flex items-center space-x-2">
              <Switch
                id="analytics-enabled"
                checked={settings.analytics_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, analytics_enabled: checked })}
              />
              <Label htmlFor="analytics-enabled">Enable Analytics Tracking</Label>
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

          {/* Google Analytics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Google Analytics 4</h3>
              {settings.google_analytics_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testGoogleAnalytics}
                  disabled={testingGA}
                  className="gap-2 bg-transparent"
                >
                  {testingGA ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                  Test
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ga-id">Google Analytics Measurement ID</Label>
              <Input
                id="ga-id"
                placeholder="G-XXXXXXXXXX"
                value={settings.google_analytics_id}
                onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Find this in Google Analytics → Admin → Property Settings → Measurement ID
              </p>
            </div>
          </div>

          {/* Google Tag Manager */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Google Tag Manager</h3>
            <div className="space-y-2">
              <Label htmlFor="gtm-id">Google Tag Manager Container ID</Label>
              <Input
                id="gtm-id"
                placeholder="GTM-XXXXXXX"
                value={settings.google_tag_manager_id}
                onChange={(e) => setSettings({ ...settings, google_tag_manager_id: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Find this in Google Tag Manager → Container Settings → Container ID
              </p>
            </div>
          </div>

          {/* Facebook Pixel */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Facebook Pixel</h3>
            <div className="space-y-2">
              <Label htmlFor="fb-pixel">Facebook Pixel ID</Label>
              <Input
                id="fb-pixel"
                placeholder="1234567890123456"
                value={settings.facebook_pixel_id}
                onChange={(e) => setSettings({ ...settings, facebook_pixel_id: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Find this in Facebook Business Manager → Events Manager → Pixels
              </p>
            </div>
          </div>

          {/* Debug Information */}
          {settings.google_analytics_id && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Debug Information</strong>
                <br />
                GA ID: {settings.google_analytics_id}
                <br />
                Analytics Enabled: {settings.analytics_enabled ? "Yes" : "No"}
                <br />
                Cookie Banner: {settings.cookie_banner_enabled ? "Enabled" : "Disabled"}
              </AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Save Cookie Settings
            </Button>
          </div>

          {/* Status Message */}
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
