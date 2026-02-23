'use client'

import { useState, useCallback } from 'react'
import Crop from 'react-easy-crop'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageCropperProps {
  open: boolean
  imageSrc: string
  onCropComplete: (croppedImage: Blob) => void
  onClose: () => void
}

export function ImageCropper({ open, imageSrc, onCropComplete, onClose }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropChange = (crop: any) => {
    setCrop(crop)
  }

  const onCroppedAreaPixelsChange = useCallback((croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCropImage = async () => {
    if (!croppedAreaPixels) return

    try {
      const image = new Image()
      image.src = imageSrc
      
      image.onload = async () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size to cropped area
        canvas.width = croppedAreaPixels.width
        canvas.height = croppedAreaPixels.height

        // Draw cropped image with rotation
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.translate(-canvas.width / 2, -canvas.height / 2)
        
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        )

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            onCropComplete(blob)
            onClose()
          }
        }, 'image/jpeg', 0.9)
      }
    } catch (error) {
      console.error('Error cropping image:', error)
    }
  }

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop Area */}
          <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden" style={{ height: '400px' }}>
            <Crop
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={16 / 9}
              cropShape="rect"
              showGrid
              onCropChange={onCropChange}
              onCropComplete={onCroppedAreaPixelsChange}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Zoom
              </Label>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={rotateImage}
                className="w-full"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Rotate 90°
              </Button>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              💡 Drag to move, scroll to zoom, or use controls to adjust. Image will be saved as 16:9 aspect ratio.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleCropImage} className="bg-blue-600 hover:bg-blue-700">
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
