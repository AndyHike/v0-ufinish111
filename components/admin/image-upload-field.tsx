'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Check, AlertCircle, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ImageCropper } from './image-cropper'

interface ImageUploadFieldProps {
  value: string
  onChange: (url: string) => void
  onUploadComplete?: (url: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ImageUploadField({
  value,
  onChange,
  onUploadComplete,
  disabled = false,
  placeholder = 'Featured Image URL or Click to Upload',
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string>(value)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCropComplete = async (croppedBlob: Blob) => {
    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create File from Blob
      const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'article')

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.random() * 30
          return next > 90 ? 90 : next
        })
      }, 200)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        let errorMessage = 'Failed to upload image'
        
        if (response.status === 413) {
          errorMessage = 'File is too large. Please use a smaller image (max 10MB before compression).'
        } else if (response.status === 400) {
          try {
            const data = await response.json()
            errorMessage = data.error || errorMessage
          } catch {
            errorMessage = 'Invalid image file. Please try another image.'
          }
        } else if (response.status === 401) {
          errorMessage = 'You are not authorized to upload images'
        } else if (response.status === 500) {
          try {
            const data = await response.json()
            errorMessage = data.error || 'Server error during upload'
          } catch {
            errorMessage = 'Server error. Check your Cloudflare S3 configuration.'
          }
        }
        
        throw new Error(errorMessage)
      }

      let data
      try {
        data = await response.json()
      } catch {
        throw new Error('Invalid response from server. Check your configuration.')
      }

      const imageUrl = data.url

      setUploadProgress(100)
      setPreview(imageUrl)
      onChange(imageUrl)

      setTimeout(() => {
        setUploadProgress(0)
      }, 500)

      onUploadComplete?.(imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    // Create preview for cropper
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setSelectedImageForCrop(result)
      setIsCropperOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleRemoveImage = () => {
    setPreview('')
    onChange('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label>Featured Image</Label>
      
      {error && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {preview ? (
        <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="bg-blue-500 text-white rounded-full p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {uploadProgress === 100 && (
              <div className="bg-green-500 text-white rounded-full p-2">
                <Check className="h-4 w-4" />
              </div>
            )}
            {!isUploading && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click()
                  }}
                  disabled={disabled}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition"
                  title="Replace image"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={disabled}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              Drag image here or click to upload
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPEG, or WebP • Max 10MB
            </p>
            {isUploading && (
              <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading... {Math.round(uploadProgress)}%
              </div>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      <p className="text-xs text-gray-500">
        💡 Your image will be automatically compressed and optimized. Recommended size: at least 1200px wide.
      </p>

      {/* Image Cropper Modal */}
      {selectedImageForCrop && (
        <ImageCropper
          open={isCropperOpen}
          imageSrc={selectedImageForCrop}
          onCropComplete={handleCropComplete}
          onClose={() => {
            setIsCropperOpen(false)
            setSelectedImageForCrop(null)
          }}
        />
      )}
    </div>
  )
}

