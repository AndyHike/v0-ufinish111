"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Loader2, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { compressImage, formatFileSize, isSupportedImageFormat } from "@/lib/image-compression"

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void
  currentImageUrl?: string | null
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export function ImageUpload({ 
  onImageUploaded, 
  currentImageUrl,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.8
}: ImageUploadProps) {
  const t = useTranslations("Admin")
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [compressionInfo, setCompressionInfo] = useState<{ original: string; compressed: string } | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!isSupportedImageFormat(file)) {
      toast({
        title: t("error"),
        description: "Підтримуються формати: PNG, JPG, WebP, GIF. Максимум 5MB.",
        variant: "destructive",
      })
      return
    }

    // Check file size (max 5MB before compression)
    const maxSizeMB = 5
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: t("error"),
        description: `Файл занадто великий. Максимум ${maxSizeMB}MB.`,
        variant: "destructive",
      })
      return
    }

    setIsCompressing(true)

    try {
      // Show original file size
      const originalSize = formatFileSize(file.size)
      
      // Compress image to WebP
      const compressedBlob = await compressImage(file, {
        maxWidth,
        maxHeight,
        quality,
      })

      // Show compression info
      const compressedSize = formatFileSize(compressedBlob.size)
      const ratio = Math.round((1 - compressedBlob.size / file.size) * 100)
      setCompressionInfo({
        original: originalSize,
        compressed: compressedSize,
      })

      console.log(`[v0] Image compression: ${originalSize} → ${compressedSize} (${ratio}% savings)`)

      // Create a new File from the compressed blob
      const compressedFile = new File([compressedBlob], `${file.name.split('.')[0]}.webp`, {
        type: 'image/webp',
        lastModified: Date.now(),
      })

      setIsUploading(true)

      // Upload compressed image
      const formData = new FormData()
      formData.append("file", compressedFile)

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload image")
      }

      const data = await response.json()
      setPreviewUrl(data.url)
      onImageUploaded(data.url)

      toast({
        title: t("success"),
        description: `Фото завантажено! Компресія: ${originalSize} → ${compressedSize}`,
      })
    } catch (error) {
      console.error("Error processing image:", error)
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("imageUploadFailed"),
        variant: "destructive",
      })
      setCompressionInfo(null)
    } finally {
      setIsCompressing(false)
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
          disabled={isUploading || isCompressing}
        >
          {isCompressing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Стиснення...
            </>
          ) : isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Завантаження...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {t("uploadImage")}
            </>
          )}
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading || isCompressing}
        />
        <span className="text-xs text-muted-foreground">PNG, JPG, WebP, GIF (макс. 5MB)</span>
      </div>

      {/* Compression Info */}
      {compressionInfo && (
        <div className="flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Фото стиснено!</p>
            <p className="text-xs">{compressionInfo.original} → {compressionInfo.compressed}</p>
          </div>
        </div>
      )}

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
                setPreviewUrl("/placeholder.svg")
                toast({
                  title: t("warning"),
                  description: "Помилка при завантаженні превью",
                  variant: "default",
                })
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground break-all">{previewUrl}</p>
        </div>
      )}
    </div>
  )
}
