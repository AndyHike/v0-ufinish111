"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function PromotionalBannerManager() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState({
    id: "",
    enabled: false,
    color: "bg-orange-500",
    text_cs: "",
    text_en: "",
    text_uk: "",
    button_text_cs: "Získat slevu",
    button_text_en: "Get discount",
    button_text_uk: "Отримати знижку",
  })

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const response = await fetch("/api/admin/promotional-banner")
        if (response.ok) {
          const data = await response.json()
          if (data) {
            setBanner(data)
          }
        }
      } catch (error) {
        console.error("Failed to fetch banner:", error)
        toast({
          title: "Помилка",
          description: "Не вдалося завантажити дані банера",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBanner()
  }, [toast])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/promotional-banner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(banner),
      })

      if (response.ok) {
        toast({
          title: "Успіх",
          description: "Налаштування банера збережено",
        })
      } else {
        throw new Error("Failed to save banner")
      }
    } catch (error) {
      console.error("Error saving banner:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти налаштування",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const colorOptions = [
    { value: "bg-orange-500", label: "Orange (Recommended)" },
    { value: "bg-red-500", label: "Red" },
    { value: "bg-amber-500", label: "Amber" },
    { value: "bg-yellow-500", label: "Yellow" },
    { value: "bg-green-500", label: "Green" },
    { value: "bg-blue-500", label: "Blue" },
    { value: "bg-purple-500", label: "Purple" },
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
        <CardTitle>Акційний банер</CardTitle>
        <CardDescription>
          Налаштуйте акційний банер, який відображається над меню навігації з кнопкою для заявок
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="banner-enabled">Увімкнути банер</Label>
          <Switch
            id="banner-enabled"
            checked={banner.enabled}
            onCheckedChange={(checked) => setBanner({ ...banner, enabled: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="banner-color">Колір банера</Label>
          <Select value={banner.color} onValueChange={(value) => setBanner({ ...banner, color: value })}>
            <SelectTrigger id="banner-color">
              <SelectValue placeholder="Виберіть колір" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${option.value}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="cs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cs">Čeština</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="uk">Українська</TabsTrigger>
          </TabsList>

          <TabsContent value="cs" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="text-cs">Текст банера (чеська)</Label>
              <Input
                id="text-cs"
                value={banner.text_cs}
                onChange={(e) => setBanner({ ...banner, text_cs: e.target.value })}
                placeholder="🔥 Akce: Výměna displeje -20%! Do 31.05."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="button-cs">Текст кнопки (чеська)</Label>
              <Input
                id="button-cs"
                value={banner.button_text_cs}
                onChange={(e) => setBanner({ ...banner, button_text_cs: e.target.value })}
                placeholder="Získat slevu"
              />
            </div>
          </TabsContent>

          <TabsContent value="en" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="text-en">Текст банера (англійська)</Label>
              <Input
                id="text-en"
                value={banner.text_en}
                onChange={(e) => setBanner({ ...banner, text_en: e.target.value })}
                placeholder="🔥 Sale: Display Replacement -20%! Until 31.05."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="button-en">Текст кнопки (англійська)</Label>
              <Input
                id="button-en"
                value={banner.button_text_en}
                onChange={(e) => setBanner({ ...banner, button_text_en: e.target.value })}
                placeholder="Get discount"
              />
            </div>
          </TabsContent>

          <TabsContent value="uk" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="text-uk">Текст банера (українська)</Label>
              <Input
                id="text-uk"
                value={banner.text_uk}
                onChange={(e) => setBanner({ ...banner, text_uk: e.target.value })}
                placeholder="🔥 Акція: Заміна дисплея -20%! До 31.05."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="button-uk">Текст кнопки (українська)</Label>
              <Input
                id="button-uk"
                value={banner.button_text_uk}
                onChange={(e) => setBanner({ ...banner, button_text_uk: e.target.value })}
                placeholder="Отримати знижку"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Збереження...
              </>
            ) : (
              "Зберегти"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
