"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Loader2 } from "lucide-react"
import Image from "next/image"

export function FaviconUpload() {
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/svg+xml"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select an ICO, PNG, or SVG file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 1MB for favicon)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 1MB",
        variant: "destructive",
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setFaviconPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", fileInputRef.current.files[0])
    formData.append("type", "favicon")

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()

        // Update the favicon setting in the database
        await fetch("/api/admin/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: "site_favicon",
            value: data.url,
          }),
        })

        toast({
          title: "Success",
          description: "Favicon uploaded successfully",
        })
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload favicon",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const clearPreview = () => {
    setFaviconPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="favicon-upload">Site Favicon</Label>
        <div className="flex items-center space-x-4">
          <Input
            id="favicon-upload"
            type="file"
            accept=".ico,.png,.svg"
            onChange={handleFileSelect}
            ref={fileInputRef}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Choose Favicon</span>
          </Button>
          {faviconPreview && (
            <Button type="button" variant="outline" size="sm" onClick={clearPreview}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Accepts ICO, PNG, or SVG files. Maximum size: 1MB. Recommended size: 32x32px.
        </p>
      </div>

      {faviconPreview && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-muted/50">
            <Label className="text-sm font-medium">Preview:</Label>
            <div className="mt-2 flex items-center justify-center h-16 bg-white rounded border">
              <Image
                src={faviconPreview || "/placeholder.svg"}
                alt="Favicon preview"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            </div>
          </div>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload Favicon
          </Button>
        </div>
      )}
    </div>
  )
}
