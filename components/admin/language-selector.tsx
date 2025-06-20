"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Globe, Check } from "lucide-react"

const languages = [
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "cs", name: "Čeština", flag: "🇨🇿" },
]

export function LanguageSelector() {
  const [defaultLanguage, setDefaultLanguage] = useState<string>("uk")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    fetchDefaultLanguage()
  }, [])

  const fetchDefaultLanguage = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        const langSetting = data.settings?.find((s: any) => s.key === "default_language")
        if (langSetting) {
          setDefaultLanguage(langSetting.value)
        }
      }
    } catch (error) {
      console.error("Error fetching default language:", error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "default_language",
          value: defaultLanguage,
        }),
      })

      if (response.ok) {
        toast.success("Мову за замовчуванням успішно оновлено!")
      } else {
        throw new Error("Failed to update language")
      }
    } catch (error) {
      console.error("Error updating language:", error)
      toast.error("Помилка при оновленні мови")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Мова за замовчуванням
          </CardTitle>
          <CardDescription>Завантаження...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Мова за замовчуванням
        </CardTitle>
        <CardDescription>Оберіть мову, яка буде відображатися для нових відвідувачів сайту</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language-select">Мова</Label>
          <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
            <SelectTrigger id="language-select">
              <SelectValue placeholder="Оберіть мову" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? (
            "Збереження..."
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Зберегти
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
