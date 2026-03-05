import sharp from 'sharp'

export interface ProcessedImage {
  buffer: Buffer
  mimeType: string
  filename: string
}

const MAX_WIDTH = 1200
const QUALITY = 80

export async function processImage(
  file: File,
): Promise<ProcessedImage> {
  const buffer = await file.arrayBuffer()
  const imageBuffer = Buffer.from(buffer)

  // Validate file size before processing (10MB limit)
  const MAX_FILE_SIZE = 10 * 1024 * 1024
  if (imageBuffer.length > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit')
  }

  // Get original filename without extension
  const originalName = file.name.split('.')[0]

  try {
    // Process image: resize and convert to WebP
    const processedBuffer = await sharp(imageBuffer)
      .resize(MAX_WIDTH, undefined, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: QUALITY })
      .toBuffer()

    return {
      buffer: processedBuffer,
      mimeType: 'image/webp',
      filename: `${originalName}-${Date.now()}.webp`,
    }
  } catch (error) {
    console.error('Error processing image:', error)
    throw new Error('Failed to process image')
  }
}

export async function validateImageFile(file: File): Promise<void> {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
  const MAX_FILE_SIZE = 10 * 1024 * 1024

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, SVG, and GIF are allowed.')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit')
  }
}
