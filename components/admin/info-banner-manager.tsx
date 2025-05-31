"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function InfoBannerManager() {
  const { toast } = useToast()
  const t = useTranslations("Admin")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bannerInfo, setBannerInfo] = useState({
    message: "",
    enabled: false,
    color: "bg-amber-500 text-white",
  })

  useEffect(() => {
    const fetchBannerInfo = async () => {
      try {
        const response = await fetch("/api/info-banner")
        if (response.ok) {
          const data = await response.json()
          setBannerInfo(data)
        }
      } catch (error) {
        console.error("Failed to fetch banner info:", error)
        toast({
          title: t("error"),
          description: "Failed to fetch banner information",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBannerInfo()
  }, [t, toast])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/info-banner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bannerInfo),
      })

      if (response.ok) {
        toast({
          title: t("success"),
          description: "Banner settings saved successfully",
        })
      } else {
        throw new Error("Failed to save banner settings")
      }
    } catch (error) {
      console.error("Error saving banner settings:", error)
      toast({
        title: t("error"),
        description: "Failed to save banner settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const colorOptions = [
    { value: "bg-amber-500 text-white", label: "Amber" },
    { value: "bg-red-500 text-white", label: "Red" },
    { value: "bg-blue-500 text-white", label: "Blue" },
    { value: "bg-green-500 text-white", label: "Green" },
    { value: "bg-purple-500 text-white", label: "Purple" },
    { value: "bg-gray-800 text-white", label: "Dark" },
  ]

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Інформаційний банер</CardTitle>
        <CardDescription>Налаштуйте інформаційний банер, який відображатиметься на головній сторінці</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="banner-enabled">Увімкнути банер</Label>
          <Switch
            id="banner-enabled"
            checked={bannerInfo.enabled}
            onCheckedChange={(checked) => setBannerInfo({ ...bannerInfo, enabled: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="banner-message">Повідомлення</Label>
          <Input
            id="banner-message"
            value={bannerInfo.message}
            onChange={(e) => setBannerInfo({ ...bannerInfo, message: e.target.value })}
            placeholder="Введіть текст повідомлення"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="banner-color">Колір банера</Label>
          <Select value={bannerInfo.color} onValueChange={(value) => setBannerInfo({ ...bannerInfo, color: value })}>
            <SelectTrigger id="banner-color">
              <SelectValue placeholder="Виберіть колір" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              t("save")
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
