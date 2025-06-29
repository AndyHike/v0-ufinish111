"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Loader2, Save, Settings, Eye, EyeOff, CheckCircle, AlertCircle, Shield, Info } from "lucide-react"

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
  const [showIds, setShowIds] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/cookie-settings")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setSettings(data)
    } catch (error) {
      toast.error("Failed to load cookie settings")
      console.error("Cookie settings fetch error:", error)
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

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save settings")
      }

      setLastSaved(new Date())
      toast.success("Cookie settings saved successfully!")
    } catch (error) {
      toast.error("Failed to save cookie settings")
      console.error("Cookie settings save error:", error)
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
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cookie & Analytics Settings
          </div>
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
          Configure analytics and marketing services. Analytics will activate immediately when users consent to cookies
          without requiring page reload.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Ad Blocker Warning */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Ad Blocker Notice:</strong> Some users may have ad blockers or privacy extensions that block
            Facebook Pixel and other tracking scripts. The system includes fallback mechanisms to handle this
            gracefully.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Analytics Services</h3>

          <div className="space-y-2">
            <Label htmlFor="google_analytics_id">Google Analytics 4 Property ID</Label>
            <Input
              id="google_analytics_id"
              type={showIds ? "text" : "password"}
              placeholder="G-XXXXXXXXXX"
              value={settings.google_analytics_id}
              onChange={(e) => updateSetting("google_analytics_id", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find this in Google Analytics → Admin → Property Settings → Property Details
            </p>
            {settings.google_analytics_id && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span className="text-blue-600">
                  Current ID: {showIds ? settings.google_analytics_id : "G-***********"}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_tag_manager_id">Google Tag Manager Container ID</Label>
            <Input
              id="google_tag_manager_id"
              type={showIds ? "text" : "password"}
              placeholder="GTM-XXXXXXX"
              value={settings.google_tag_manager_id}
              onChange={(e) => updateSetting("google_tag_manager_id", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Find this in Google Tag Manager → Container Settings</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Marketing Services</h3>

          <div className="space-y-2">
            <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
            <Input
              id="facebook_pixel_id"
              type={showIds ? "text" : "password"}
              placeholder="1823195131746594"
              value={settings.facebook_pixel_id}
              onChange={(e) => updateSetting("facebook_pixel_id", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Find this in Facebook Business Manager → Events Manager</p>
            {settings.facebook_pixel_id && (
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-orange-500" />
                <span className="text-orange-600">
                  Facebook Pixel may be blocked by ad blockers. Check browser console for status.
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

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
