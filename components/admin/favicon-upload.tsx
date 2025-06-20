"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Upload, Star, X } from "lucide-react"
import Image from "next/image"

export function FaviconUpload() {
  const [currentFavicon, setCurrentFavicon] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCurrentFavicon()
  }, [])

  const fetchCurrentFavicon = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        const faviconSetting = data.settings?.find((s: any) => s.key === "site_favicon")
        if (faviconSetting) {
          setCurrentFavicon(faviconSetting.value)
        }
      }
    } catch (error) {
      console.error("Error fetching current favicon:", error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/svg+xml"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Будь ласка, оберіть файл ICO, PNG або SVG")
      return
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error("Розмір файлу не повинен перевищувати 1MB")
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
      formData.append("type", "favicon")

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()

      // Save favicon URL to settings
      const settingsResponse = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "site_favicon",
          value: data.url,
        }),
      })

      if (settingsResponse.ok) {
        setCurrentFavicon(data.url)
        setPreviewUrl(null)
        toast.success("Фавікон успішно оновлено!")
      } else {
        throw new Error("Failed to save favicon setting")
      }
    } catch (error) {
      console.error("Error uploading favicon:", error)
      toast.error("Помилка при завантаженні фавікону")
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
            <Star className="h-5 w-5" />
            Фавікон сайту
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
          <Star className="h-5 w-5" />
          Фавікон сайту
        </CardTitle>
        <CardDescription>Завантажте новий фавікон для вашого сайту (ICO, PNG, SVG, макс. 1MB)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Favicon */}
        {currentFavicon && !previewUrl && (
          <div className="space-y-2">
            <Label>Поточний фавікон</Label>
            <div className="border rounded-lg p-4 bg-gray-50">
              <Image
                src={currentFavicon || "/placeholder.svg"}
                alt="Current favicon"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
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
                alt="Favicon preview"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
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
          <Label htmlFor="favicon-upload">Завантажити новий фавікон</Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              id="favicon-upload"
              type="file"
              accept=".ico,.png,.svg,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml"
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
