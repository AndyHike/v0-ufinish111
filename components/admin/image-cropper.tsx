'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface ImageCropperProps {
  open: boolean
  imageSrc: string
  onCropComplete: (croppedImage: Blob) => void
  onClose: () => void
}

export function ImageCropper({ open, imageSrc, onCropComplete, onClose }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const CROP_WIDTH = 1200
  const CROP_HEIGHT = 675 // 16:9 aspect ratio
  const DISPLAY_WIDTH = 500
  const DISPLAY_HEIGHT = 281

  useEffect(() => {
    if (!open) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      redraw()
    }
    img.onerror = () => {
      console.error('Failed to load image')
    }
    img.src = imageSrc
  }, [open, imageSrc])

  const redraw = () => {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = DISPLAY_WIDTH
    canvas.height = DISPLAY_HEIGHT

    // Draw background
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Save context state
    ctx.save()

    // Move to center and apply transformations
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    ctx.translate(centerX, centerY)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale, scale)

    // Draw image centered
    const img = imageRef.current
    ctx.drawImage(img, -img.width / 2 + offset.x, -img.height / 2 + offset.y)

    ctx.restore()

    // Draw crop area outline (16:9 rectangle)
    const cropW = (CROP_WIDTH / 1920) * canvas.width
    const cropH = (CROP_HEIGHT / 1080) * canvas.height
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.strokeRect(canvas.width / 2 - cropW / 2, canvas.height / 2 - cropH / 2, cropW, cropH)

    // Draw grid
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'
    ctx.lineWidth = 1
    const gridW = cropW / 3
    const gridH = cropH / 3
    for (let i = 1; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(canvas.width / 2 - cropW / 2 + i * gridW, canvas.height / 2 - cropH / 2)
      ctx.lineTo(canvas.width / 2 - cropW / 2 + i * gridW, canvas.height / 2 + cropH / 2)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(canvas.width / 2 - cropW / 2, canvas.height / 2 - cropH / 2 + i * gridH)
      ctx.lineTo(canvas.width / 2 + cropW / 2, canvas.height / 2 - cropH / 2 + i * gridH)
      ctx.stroke()
    }
  }

  useEffect(() => {
    redraw()
  }, [scale, rotation, offset])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCrop = () => {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current) return

    // Create a new canvas for the final cropped image
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = CROP_WIDTH
    finalCanvas.height = CROP_HEIGHT

    const ctx = finalCanvas.getContext('2d')
    if (!ctx) return

    // Apply transformations
    ctx.save()
    ctx.translate(CROP_WIDTH / 2, CROP_HEIGHT / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale, scale)

    const img = imageRef.current
    const scaleFactor = CROP_WIDTH / DISPLAY_WIDTH
    ctx.drawImage(
      img,
      (-img.width / 2 + offset.x) * scaleFactor,
      (-img.height / 2 + offset.y) * scaleFactor,
      img.width * scaleFactor,
      img.height * scaleFactor
    )

    ctx.restore()

    // Convert to blob and pass to handler
    finalCanvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob)
        onClose()
      }
    }, 'image/jpeg', 0.95)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop and Adjust Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas */}
          <div ref={containerRef} className="border-2 border-gray-300 rounded-lg bg-gray-50 flex justify-center overflow-auto">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="cursor-move"
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Zoom: {scale.toFixed(2)}x
              </Label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                Rotation: {rotation}°
              </Label>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Info */}
            <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
              💡 Drag on the canvas to reposition the image. Use zoom and rotation controls to adjust. The blue rectangle shows the crop area (16:9 • 1200x675px).
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleCrop} className="bg-blue-600 hover:bg-blue-700">
            Crop and Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
