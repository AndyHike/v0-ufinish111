"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Loader2 } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string, webpUrl?: string | null) => void
  currentImageUrl?: string | null
}

export function ImageUpload({ onImageUploaded, currentImageUrl }: ImageUploadProps) {
  const t = useTranslations("Admin")
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [compressionInfo, setCompressionInfo] = useState<{
    percentage: number
    saved: number
    originalSize: number
    optimizedSize: number
    webpSize: number
  } | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: t("error"),
        description: t("invalidFileType"),
        variant: "destructive",
      })
      return
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t("error"),
        description: t("fileTooLarge"),
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload image")
      }

      const data = await response.json()
      setPreviewUrl(data.webpUrl || data.url) // Use WebP if available
      onImageUploaded(data.url, data.webpUrl)
      setCompressionInfo({
        percentage: data.compression?.percentage || 0,
        saved: data.compression?.saved || 0,
        originalSize: data.originalSize || 0,
        optimizedSize: data.optimizedSize || 0,
        webpSize: data.webpSize || 0,
      })

      toast({
        title: t("success"),
        description: t("imageUploadedSuccess"),
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: t("error"),
        description: t("imageUploadFailed"),
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("image-upload")?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {t("uploadImage")}
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>

      {previewUrl && (
        <div className="relative mt-2 rounded-md border border-border p-2">
          <div className="aspect-square h-32 w-32 overflow-hidden rounded-md">
            <Image
              src={previewUrl || "/placeholder.svg"}
              alt="Preview"
              width={128}
              height={128}
              className="h-full w-full object-contain"
              onError={() => {
                setPreviewUrl("/abstract-geometric-shapes.png")
                toast({
                  title: t("warning"),
                  description: t("imageLoadError"),
                  variant: "warning",
                })
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground break-all">{previewUrl}</p>
          
          {compressionInfo && (
            <div className="mt-3 rounded-md bg-muted p-2 text-xs space-y-1">
              <div className="text-muted-foreground">
                {t("imageOptimization") || "Image Optimization"}: <span className="font-semibold text-foreground">{compressionInfo.percentage}% {t("saved") || "saved"}</span>
              </div>
              <div className="text-muted-foreground">
                {t("originalSize") || "Original"}: {(compressionInfo.originalSize / 1024).toFixed(1)}KB
              </div>
              <div className="text-muted-foreground">
                JPEG: {(compressionInfo.optimizedSize / 1024).toFixed(1)}KB
              </div>
              {compressionInfo.webpSize > 0 && (
                <div className="text-muted-foreground">
                  WebP: {(compressionInfo.webpSize / 1024).toFixed(1)}KB
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
