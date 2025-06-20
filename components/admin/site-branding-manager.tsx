"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Loader2, Save } from "lucide-react"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface BrandingSettings {
  site_logo?: string
  site_favicon?: string
  default_language?: string
}

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "cs", name: "Čeština (Czech)" },
  { code: "uk", name: "Українська (Ukrainian)" },
]

export function SiteBrandingManager() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<BrandingSettings>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)

  // Load current settings
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        const settingsMap: BrandingSettings = {}

        data.settings?.forEach((setting: any) => {
          settingsMap[setting.key as keyof BrandingSettings] = setting.value
        })

        setSettings(settingsMap)
        setLogoPreview(settingsMap.site_logo || null)
        setFaviconPreview(settingsMap.site_favicon || null)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Error",
        description: "Failed to load current settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateImageFile = (file: File, type: "logo" | "favicon") => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid image file (PNG, JPG, GIF, etc.)",
        variant: "destructive",
      })
      return false
    }

    // Check file size (max 2MB for logo, 1MB for favicon)
    const maxSize = type === "logo" ? 2 * 1024 * 1024 : 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `${type === "logo" ? "Logo" : "Favicon"} must be smaller than ${type === "logo" ? "2MB" : "1MB"}`,
        variant: "destructive",
      })
      return false
    }

    // For favicon, recommend square dimensions
    if (type === "favicon") {
      const img = new window.Image()
      img.onload = () => {
        if (img.width !== img.height) {
          toast({
            title: "Favicon Recommendation",
            description: "For best results, use a square image (e.g., 32x32, 64x64, 128x128)",
            variant: "default",
          })
        }
      }
      img.src = URL.createObjectURL(file)
    }

    return true
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (validateImageFile(file, "logo")) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (validateImageFile(file, "favicon")) {
      setFaviconFile(file)
      setFaviconPreview(URL.createObjectURL(file))
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to upload file")
    }

    const data = await response.json()
    return data.url
  }

  const updateSetting = async (key: string, value: string) => {
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key, value }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to update setting")
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Upload logo if changed
      if (logoFile) {
        const logoUrl = await uploadFile(logoFile)
        await updateSetting("site_logo", logoUrl)
        setSettings((prev) => ({ ...prev, site_logo: logoUrl }))
        setLogoFile(null)
      }

      // Upload favicon if changed
      if (faviconFile) {
        const faviconUrl = await uploadFile(faviconFile)
        await updateSetting("site_favicon", faviconUrl)
        setSettings((prev) => ({ ...prev, site_favicon: faviconUrl }))
        setFaviconFile(null)
      }

      toast({
        title: "Success",
        description: "Branding settings updated successfully. Changes will be visible after page refresh.",
      })

      // Refresh the page to show changes
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save branding settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLanguageChange = async (language: string) => {
    try {
      await updateSetting("default_language", language)
      setSettings((prev) => ({ ...prev, default_language: language }))

      toast({
        title: "Success",
        description: "Default language updated successfully",
      })
    } catch (error) {
      console.error("Error updating language:", error)
      toast({
        title: "Error",
        description: "Failed to update default language",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Logo Upload Section */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Site Logo</Label>
          <p className="text-sm text-muted-foreground">
            Upload your website logo (max 2MB, recommended: PNG with transparent background)
          </p>
        </div>

        <div className="flex items-start gap-6">
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("logo-upload")?.click()}
              disabled={isSaving}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Logo
            </Button>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
              disabled={isSaving}
            />
          </div>

          {logoPreview && (
            <div className="relative rounded-md border border-border p-4 bg-white">
              <div className="h-16 w-32 relative">
                <Image src={logoPreview || "/placeholder.svg"} alt="Logo Preview" fill className="object-contain" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Preview</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Favicon Upload Section */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Favicon</Label>
          <p className="text-sm text-muted-foreground">
            Upload your website favicon (max 1MB, recommended: 32x32 or 64x64 PNG/ICO)
          </p>
        </div>

        <div className="flex items-start gap-6">
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("favicon-upload")?.click()}
              disabled={isSaving}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Favicon
            </Button>
            <input
              id="favicon-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFaviconChange}
              disabled={isSaving}
            />
          </div>

          {faviconPreview && (
            <div className="relative rounded-md border border-border p-4 bg-white">
              <div className="h-8 w-8 relative">
                <Image
                  src={faviconPreview || "/placeholder.svg"}
                  alt="Favicon Preview"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Preview</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Default Language Section */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Default Language</Label>
          <p className="text-sm text-muted-foreground">Set the default language for your website</p>
        </div>

        <Select value={settings.default_language || "en"} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select default language" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || (!logoFile && !faviconFile)}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
