import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"
import sharp from "sharp"

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const uploadType = (formData.get("type") as string) || "default"
    const slug = formData.get("slug") as string // Додаємо slug для послуг

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Define allowed types and max sizes based on upload type
    const allowedTypes = {
      logo: ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"],
      favicon: ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/svg+xml"],
      service: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      default: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
    }

    const maxSizes = {
      logo: 5 * 1024 * 1024, // 5MB
      favicon: 1024 * 1024, // 1MB
      service: 5 * 1024 * 1024, // 5MB для послуг
      default: 2 * 1024 * 1024, // 2MB
    }

    const allowedFileTypes = allowedTypes[uploadType as keyof typeof allowedTypes] || allowedTypes.default
    const maxFileSize = maxSizes[uploadType as keyof typeof maxSizes] || maxSizes.default

    // Validate file type
    if (!allowedFileTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size
    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)

    // Process image with Sharp for optimization
    let processedBuffer = buffer
    let webpBuffer: Buffer | null = null
    let originalSize = buffer.length
    let optimizedSize = 0
    let webpSize = 0

    try {
      // For image uploads, optimize with Sharp
      if (
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/webp" ||
        file.type === "image/jpg"
      ) {
        // Create Sharp instance
        const image = sharp(buffer)

        // Get metadata for resizing
        const metadata = await image.metadata()
        const maxWidth = 2000
        const maxHeight = 2000

        // Resize if needed and compress JPEG/PNG
        const optimized = await image
          .rotate() // Auto-rotate based on EXIF
          .resize(maxWidth, maxHeight, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 78, progressive: true }) // Optimize to JPEG
          .toBuffer()

        processedBuffer = optimized
        optimizedSize = optimized.length

        // Generate WebP version
        webpBuffer = await sharp(buffer)
          .rotate()
          .resize(maxWidth, maxHeight, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 75 })
          .toBuffer()

        webpSize = webpBuffer.length
      }
    } catch (error) {
      console.error("Error processing image with Sharp:", error)
      // Fallback to original buffer if Sharp processing fails
      processedBuffer = buffer
      optimizedSize = buffer.length
    }

    // Generate filename based on upload type
    let fileName: string
    let fileNameWebp: string | null = null
    const fileExtension = "jpg" // Always save optimized as JPG
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)

    if (uploadType === "service" && slug) {
      // Для послуг використовуємо slug як назву файлу
      fileName = `services/${slug}.${fileExtension}`
      fileNameWebp = `services/${slug}.webp`
    } else {
      // Для інших типів використовуємо timestamp + random
      fileName = `${uploadType}/${timestamp}-${randomStr}.${fileExtension}`
      fileNameWebp = `${uploadType}/${timestamp}-${randomStr}.webp`
    }

    // Upload to Supabase Storage
    const supabase = createClient()

    // Create the bucket if it doesn't exist
    const bucketName = "site-assets"
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets?.find((bucket) => bucket.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
      })
    }

    // Якщо файл з таким ім'ям вже існує, видаляємо його
    if (uploadType === "service" && slug) {
      await supabase.storage.from(bucketName).remove([fileName, fileNameWebp || ""])
    }

    // Upload optimized JPEG
    const { data: jpegData, error: jpegError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, processedBuffer, {
        contentType: "image/jpeg",
        cacheControl: "86400", // 24 hours
        upsert: true,
      })

    if (jpegError) {
      console.error("Error uploading JPEG:", jpegError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Upload WebP version if available
    let webpUrl = null
    if (webpBuffer) {
      const { data: webpData, error: webpError } = await supabase.storage
        .from(bucketName)
        .upload(fileNameWebp!, webpBuffer, {
          contentType: "image/webp",
          cacheControl: "86400",
          upsert: true,
        })

      if (!webpError && webpData) {
        const { data: webpPublicUrl } = supabase.storage.from(bucketName).getPublicUrl(fileNameWebp!)
        webpUrl = webpPublicUrl.publicUrl
      }
    }

    // Get the public URLs
    const { data: jpegPublicUrl } = supabase.storage.from(bucketName).getPublicUrl(fileName)

    return NextResponse.json({
      url: jpegPublicUrl.publicUrl,
      webpUrl: webpUrl,
      originalSize: originalSize,
      optimizedSize: optimizedSize,
      webpSize: webpSize,
      compression: {
        percentage: originalSize > 0 ? Math.round(((originalSize - optimizedSize) / originalSize) * 100) : 0,
        saved: originalSize - optimizedSize,
      },
    })
  } catch (error) {
    console.error("Error handling file upload:", error)
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
  }
}
