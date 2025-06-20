"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Upload, ImageIcon, X } from "lucide-react"
import Image from "next/image"

export function LogoUpload() {
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCurrentLogo()
  }, [])

  const fetchCurrentLogo = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        const logoSetting = data.settings?.find((s: any) => s.key === "site_logo")
        if (logoSetting) {
          setCurrentLogo(logoSetting.value)
        }
      }
    } catch (error) {
      console.error("Error fetching current logo:", error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Будь ласка, оберіть файл зображення")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Розмір файлу не повинен перевищувати 5MB")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "logo")

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()

      // Save logo URL to settings
      const settingsResponse = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "site_logo",
          value: data.url,
        }),
      })

      if (settingsResponse.ok) {
        setCurrentLogo(data.url)
        setPreviewUrl(null)
        toast.success("Логотип успішно оновлено!")
      } else {
        throw new Error("Failed to save logo setting")
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast.error("Помилка при завантаженні логотипу")
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const clearPreview = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (isFetching) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Логотип сайту
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
          <ImageIcon className="h-5 w-5" />
          Логотип сайту
        </CardTitle>
        <CardDescription>Завантажте новий логотип для вашого сайту (PNG, JPG, SVG, макс. 5MB)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Logo */}
        {currentLogo && !previewUrl && (
          <div className="space-y-2">
            <Label>Поточний логотип</Label>
            <div className="border rounded-lg p-4 bg-gray-50">
              <Image
                src={currentLogo || "/placeholder.svg"}
                alt="Current logo"
                width={200}
                height={100}
                className="max-h-20 w-auto object-contain"
              />
            </div>
          </div>
        )}

        {/* Preview */}
        {previewUrl && (
          <div className="space-y-2">
            <Label>Попередній перегляд</Label>
            <div className="border rounded-lg p-4 bg-gray-50 relative">
              <Image
                src={previewUrl || "/placeholder.svg"}
                alt="Logo preview"
                width={200}
                height={100}
                className="max-h-20 w-auto object-contain"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={clearPreview}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Upload */}
        <div className="space-y-2">
          <Label htmlFor="logo-upload">Завантажити новий логотип</Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
              className="w-full"
            >
              {isUploading ? (
                "Завантаження..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Обрати файл
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
