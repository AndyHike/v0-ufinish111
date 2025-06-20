"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Loader2 } from "lucide-react"
import Image from "next/image"

export function LogoUpload() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a PNG, JPG, or SVG file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", fileInputRef.current.files[0])
    formData.append("type", "logo")

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()

        // Update the logo setting in the database
        await fetch("/api/admin/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: "site_logo",
            value: data.url,
          }),
        })

        toast({
          title: "Success",
          description: "Logo uploaded successfully",
        })
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const clearPreview = () => {
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="logo-upload">Site Logo</Label>
        <div className="flex items-center space-x-4">
          <Input
            id="logo-upload"
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
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
            <span>Choose Logo</span>
          </Button>
          {logoPreview && (
            <Button type="button" variant="outline" size="sm" onClick={clearPreview}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Accepts PNG, JPG, or SVG files. Maximum size: 5MB.</p>
      </div>

      {logoPreview && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-muted/50">
            <Label className="text-sm font-medium">Preview:</Label>
            <div className="mt-2 flex items-center justify-center h-20 bg-white rounded border">
              <Image
                src={logoPreview || "/placeholder.svg"}
                alt="Logo preview"
                width={80}
                height={80}
                className="max-h-16 w-auto object-contain"
              />
            </div>
          </div>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload Logo
          </Button>
        </div>
      )}
    </div>
  )
}
