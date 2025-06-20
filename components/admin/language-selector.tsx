"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const SUPPORTED_LANGUAGES = [
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "cs", name: "Čeština", flag: "🇨🇿" },
]

export function LanguageSelector() {
  const [defaultLanguage, setDefaultLanguage] = useState<string>("uk")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchDefaultLanguage()
  }, [])

  const fetchDefaultLanguage = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        const languageSetting = data.settings?.find((s: any) => s.key === "default_language")
        if (languageSetting) {
          setDefaultLanguage(languageSetting.value)
        }
      }
    } catch (error) {
      console.error("Error fetching default language:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
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
        toast({
          title: "Success",
          description: "Default language updated successfully",
        })
      } else {
        throw new Error("Failed to update default language")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update default language",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="default-language">Default Site Language</Label>
        <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select default language" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <div className="flex items-center space-x-2">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          This language will be displayed to users when they first visit the site.
        </p>
      </div>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Language Setting
      </Button>
    </div>
  )
}
