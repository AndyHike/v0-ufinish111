import { NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"
import { s3Client } from "@/lib/s3-client"
import { processImage, validateImageFile } from "@/lib/image-processor"

export async function POST(request: Request) {
  try {
    console.log('[v0] Upload API called')

    // Check authentication
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('[v0] User authenticated:', session.user.email)

    // Get the form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const uploadType = (formData.get("type") as string) || "model"
    const slug = formData.get("slug") as string

    console.log('[v0] Upload details - Type:', uploadType, 'File size:', file?.size, 'File type:', file?.type)

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Handle article and model image uploads with S3
    if (uploadType === "article" || uploadType === "model") {
      try {
        console.log(`[v0] Processing ${uploadType} image for S3`)

        // Validate image file
        await validateImageFile(file)
        console.log('[v0] Image validation passed')

        // Process image (resize, compress, convert to WebP)
        const { buffer, mimeType, filename: processedFilename } = await processImage(file)

        // For models and hero-carousel, use slug if available
        let finalFilename = processedFilename
        if ((uploadType === "model" || uploadType === "hero-carousel") && slug) {
          finalFilename = `${slug}.webp`
        }

        console.log('[v0] Image processed - Compressed size:', buffer.length, 'Filename:', finalFilename)

        // Upload to Cloudflare S3
        if (!process.env.CLOUDFLARE_BUCKET_NAME) {
          throw new Error("CLOUDFLARE_BUCKET_NAME is not set")
        }

        const s3Key = uploadType === "article"
          ? `articles/${finalFilename}`
          : uploadType === "hero-carousel"
            ? `hero-carousel/${finalFilename}`
            : `models/${finalFilename}`
        console.log('[v0] Uploading to S3 with key:', s3Key)

        const putCommand = new PutObjectCommand({
          Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: mimeType,
          CacheControl: "max-age=86400", // 24 hours
        })

        await s3Client.send(putCommand)
        console.log('[v0] Upload to S3 successful')

        // Generate public URL
        const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${s3Key}`
        console.log('[v0] Public URL generated:', publicUrl)

        return NextResponse.json({
          url: publicUrl,
          type: "s3",
          filename: finalFilename,
        })
      } catch (error) {
        console.error(`[v0] Error uploading ${uploadType} image to S3:`, error)
        const message = error instanceof Error ? error.message : "Failed to upload image"
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    // Existing logic for other upload types (logo, favicon, service, model)
    // Define allowed types and max sizes based on upload type
    const allowedTypes = {
      logo: ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"],
      favicon: ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/svg+xml"],
      service: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      model: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      "hero-carousel": ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      default: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
    }

    const maxSizes = {
      logo: 5 * 1024 * 1024,
      favicon: 1024 * 1024,
      service: 5 * 1024 * 1024,
      model: 5 * 1024 * 1024,
      "hero-carousel": 5 * 1024 * 1024,
      default: 2 * 1024 * 1024,
    }

    const allowedFileTypes = allowedTypes[uploadType as keyof typeof allowedTypes] || allowedTypes.default
    const maxFileSize = maxSizes[uploadType as keyof typeof maxSizes] || maxSizes.default

    // Validate file type - accept WebP (which is what we send after compression)
    const isValidType = allowedFileTypes.includes(file.type) || file.type === "image/webp"
    if (!isValidType) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size
    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate filename based on upload type
    let fileName: string
    const fileExtension = file.name.split(".").pop() || "webp"

    if (uploadType === "model" && slug) {
      fileName = `models/${slug}.${fileExtension}`
    } else if (uploadType === "service" && slug) {
      fileName = `services/${slug}.${fileExtension}`
    } else {
      const timestamp = Date.now()
      fileName = `${uploadType}/${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
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

    // Delete old file if exists
    if (uploadType === "service" && slug) {
      await supabase.storage.from(bucketName).remove([fileName])
    }

    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      console.error("Error uploading file:", error)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get the public URL
    const { data: publicUrl } = supabase.storage.from(bucketName).getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl.publicUrl })
  } catch (error) {
    console.error("Error handling file upload:", error)
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
  }
}
