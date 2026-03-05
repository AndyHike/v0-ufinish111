import { NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSession } from "@/lib/auth/session"
import { getS3Client } from "@/lib/s3-client"
import { processImage, validateImageFile } from "@/lib/image-processor"

/**
 * Get S3 folder path based on upload type
 */
function getS3Folder(uploadType: string): string {
  switch (uploadType) {
    case "article": return "articles"
    case "brand": return "brands"
    case "logo": return "brands"
    case "model": return "models"
    case "service": return "services"
    default: return "uploads"
  }
}

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
    const uploadType = (formData.get("type") as string) || "model"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate image file
    await validateImageFile(file)

    // Process image with Sharp (resize, compress, convert to WebP)
    const { buffer, mimeType, filename } = await processImage(file)

    // Upload to Cloudflare S3
    if (!process.env.CLOUDFLARE_BUCKET_NAME) {
      throw new Error("CLOUDFLARE_BUCKET_NAME is not set")
    }
    if (!process.env.CLOUDFLARE_PUBLIC_URL) {
      throw new Error("CLOUDFLARE_PUBLIC_URL is not set")
    }

    const folder = getS3Folder(uploadType)
    const s3Key = `${folder}/${filename}`

    const s3 = getS3Client()
    const putCommand = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: "max-age=31536000", // 1 year (immutable content-addressed)
    })

    await s3.send(putCommand)

    // Generate public URL
    const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${s3Key}`

    return NextResponse.json({
      url: publicUrl,
      type: "s3",
      filename: filename,
    })
  } catch (error) {
    console.error("[upload] Error:", error)
    const message = error instanceof Error ? error.message : "Failed to upload image"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
