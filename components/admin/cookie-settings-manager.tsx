"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, Save, Settings, Eye, EyeOff, CheckCircle, AlertCircle, TestTube, Activity, Bug } from "lucide-react"

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
      console.log("Admin: Fetched settings:", data)
      setSettings(data)
    } catch (error) {
      console.error("Admin: Error fetching cookie settings:", error)
      toast.error("Failed to load cookie settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      console.log("Admin: Saving settings:", settings)

      const response = await fetch("/api/admin/cookie-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      const result = await response.json()
      console.log("Admin: Save response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to save settings")
      }

      setLastSaved(new Date())
      toast.success("Cookie settings saved successfully!")
    } catch (error) {
      console.error("Admin: Error saving cookie settings:", error)
      toast.error("Failed to save cookie settings")
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof CookieSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const testAnalytics = () => {
    console.log("🧪 Testing Google Analytics...")

    if (typeof window !== "undefined" && window.gtag) {
      const testEventName = "admin_test_" + Date.now()

      // Відправляємо тестову подію з форсованою відправкою
      window.gtag("event", testEventName, {
        event_category: "admin_test",
        event_label: "manual_test_from_admin",
        value: 1,
        custom_parameter: "test_value",
        test_timestamp: new Date().toISOString(),
        transport_type: "beacon", // Форсуємо відправку
        send_to: settings.google_analytics_id,
      })

      // Також відправляємо page_view для впевненості
      window.gtag("event", "page_view", {
        page_title: "Admin Test - " + document.title,
        page_location: window.location.href,
        custom_parameter: "admin_test",
        transport_type: "beacon",
        send_to: settings.google_analytics_id,
      })

      toast.success(`Test events sent with beacon transport! Event: ${testEventName}`)
      console.log("✅ Test events sent with forced transport:", {
        event: testEventName,
        page_view: "admin_test",
        timestamp: new Date().toISOString(),
        transport: "beacon",
      })
    } else {
      toast.error("Google Analytics not loaded. Please accept analytics cookies first.")
      console.error("❌ gtag function not available")
      console.log("Debug info:", {
        window: typeof window,
        gtag: typeof window?.gtag,
        dataLayer: window?.dataLayer?.length || 0,
      })
    }
  }

  const testRealTimeTracking = () => {
    console.log("🔴 Testing Real-time tracking with forced transport...")

    if (typeof window !== "undefined" && window.gtag) {
      const timestamp = Date.now()

      // Відправляємо серію подій для real-time тестування з форсованою відправкою
      window.gtag("event", "realtime_test_start", {
        event_category: "realtime_test",
        event_label: "test_session_" + timestamp,
        value: 1,
        transport_type: "beacon",
        send_to: settings.google_analytics_id,
      })

      setTimeout(() => {
        window.gtag("event", "realtime_test_action", {
          event_category: "realtime_test",
          event_label: "delayed_action_" + timestamp,
          value: 2,
          transport_type: "beacon",
          send_to: settings.google_analytics_id,
        })
      }, 1000)

      setTimeout(() => {
        window.gtag("event", "realtime_test_complete", {
          event_category: "realtime_test",
          event_label: "test_complete_" + timestamp,
          value: 3,
          transport_type: "beacon",
          send_to: settings.google_analytics_id,
        })
      }, 2000)

      // Форсуємо відправку page_view
      setTimeout(() => {
        window.gtag("event", "page_view", {
          page_title: "Real-time Test Page",
          page_location: window.location.href,
          custom_parameter: "realtime_test",
          transport_type: "beacon",
          send_to: settings.google_analytics_id,
        })
      }, 3000)

      toast.success("Real-time test sequence with beacon transport started! Check GA4 Real-time reports now.")
      console.log("🚀 Real-time test sequence with forced transport initiated:", timestamp)
    } else {
      toast.error("Google Analytics not available")
      console.error("❌ Cannot perform real-time test - gtag not available")
    }
  }

  const forceDataSend = () => {
    console.log("🚀 Forcing immediate data send...")

    if (typeof window !== "undefined" && window.gtag) {
      // Оновлюємо consent
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      })

      // Форсуємо відправку поточної сторінки
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
        transport_type: "beacon",
        send_to: settings.google_analytics_id,
      })

      // Відправляємо подію про форсовану відправку
      window.gtag("event", "force_data_send", {
        event_category: "admin_action",
        event_label: "manual_force_send",
        transport_type: "beacon",
        send_to: settings.google_analytics_id,
      })

      toast.success("Data send forced! Check Real-time reports.")
      console.log("✅ Forced data send completed")
    } else {
      toast.error("Google Analytics not available")
      console.error("❌ Cannot force data send - gtag not available")
    }
  }

  const debugAnalytics = () => {
    console.log("🔍 Analytics Debug Information:")
    console.log("Window object:", typeof window)
    console.log("gtag function:", typeof window?.gtag)
    console.log("dataLayer:", window?.dataLayer)
    console.log("dataLayer length:", window?.dataLayer?.length || 0)
    console.log("Current settings:", settings)
    console.log("Current URL:", window?.location?.href)
    console.log("Document title:", document?.title)

    // Перевіряємо чи є скрипт в DOM
    const gaScripts = document.querySelectorAll('script[src*="gtag/js"]')
    console.log("GA scripts in DOM:", gaScripts.length)
    gaScripts.forEach((script, index) => {
      console.log(`Script ${index + 1}:`, script.src)
    })

    // Перевіряємо dataLayer
    if (window?.dataLayer) {
      console.log("DataLayer contents:", window.dataLayer)
    }

    toast.info("Debug information logged to console")
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
          Configure analytics and marketing services. Services will automatically activate when users consent to
          cookies.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Analytics Services */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Analytics Services</h3>

          <div className="space-y-2">
            <Label htmlFor="google_analytics_id">Google Analytics 4 Property ID</Label>
            <div className="flex gap-2">
              <Input
                id="google_analytics_id"
                type={showIds ? "text" : "password"}
                placeholder="G-XXXXXXXXXX"
                value={settings.google_analytics_id}
                onChange={(e) => updateSetting("google_analytics_id", e.target.value)}
                className="flex-1"
              />
              {settings.google_analytics_id && (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={testAnalytics}>
                    <TestTube className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button variant="outline" size="sm" onClick={testRealTimeTracking}>
                    <Activity className="h-4 w-4 mr-1" />
                    Real-time
                  </Button>
                  <Button variant="outline" size="sm" onClick={forceDataSend}>
                    Force Send
                  </Button>
                  <Button variant="outline" size="sm" onClick={debugAnalytics}>
                    <Bug className="h-4 w-4 mr-1" />
                    Debug
                  </Button>
                </div>
              )}
            </div>
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

        {/* Marketing Services */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Marketing Services</h3>

          <div className="space-y-2">
            <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
            <Input
              id="facebook_pixel_id"
              type={showIds ? "text" : "password"}
              placeholder="1234567890123456"
              value={settings.facebook_pixel_id}
              onChange={(e) => updateSetting("facebook_pixel_id", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Find this in Facebook Business Manager → Events Manager</p>
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

        {/* Enhanced Debug Info */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Debug Information</h4>
          <div className="text-xs space-y-1">
            <div>GA ID: {settings.google_analytics_id || "Not set"}</div>
            <div>Analytics Enabled: {settings.analytics_enabled ? "Yes" : "No"}</div>
            <div>Cookie Banner: {settings.cookie_banner_enabled ? "Enabled" : "Disabled"}</div>
            <div>gtag Available: {typeof window !== "undefined" && window.gtag ? "✅ Yes" : "❌ No"}</div>
            <div>
              dataLayer Length: {typeof window !== "undefined" && window.dataLayer ? window.dataLayer.length : "N/A"}
            </div>
            <div>Current URL: {typeof window !== "undefined" ? window.location.href : "N/A"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
