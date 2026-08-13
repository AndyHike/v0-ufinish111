import { NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSession } from "@/lib/auth/session"
import { s3Client } from "@/lib/s3-client"
import { processImage } from "@/lib/image-processor"

// Усі завантаження йдуть у Cloudflare R2. Supabase Storage тут більше не використовується.
const S3_FOLDERS: Record<string, string> = {
  article: "articles",
  series: "series",
  model: "models",
  service: "services",
  brand: "brands",
  logo: "logo",
  favicon: "favicon",
}

// Растр проганяємо через sharp (ресайз + WebP).
const RASTER_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

// А це віддаємо як є: sharp або растеризував би SVG, або зовсім не прийняв ICO.
const PASSTHROUGH_TYPES: Record<string, string> = {
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
}

const ALLOWED_TYPES: Record<string, string[]> = {
  logo: [...RASTER_TYPES, "image/svg+xml"],
  favicon: [...RASTER_TYPES, "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"],
  brand: [...RASTER_TYPES, "image/svg+xml"],
  default: RASTER_TYPES,
}

const MAX_SIZES: Record<string, number> = {
  favicon: 1024 * 1024,
  logo: 5 * 1024 * 1024,
  service: 5 * 1024 * 1024,
  model: 5 * 1024 * 1024,
  default: 10 * 1024 * 1024,
}

/** Ім'я завжди унікальне — нічого не перезаписуємо. */
function buildKey(folder: string, extension: string) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
  return `${folder}/${unique}.${extension}`
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const uploadType = (formData.get("type") as string) || "model"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[upload] type:", uploadType, "size:", file.size, "mime:", file.type)

    const allowed = ALLOWED_TYPES[uploadType] || ALLOWED_TYPES.default
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${allowed.join(", ")}` },
        { status: 400 },
      )
    }

    const maxSize = MAX_SIZES[uploadType] ?? MAX_SIZES.default
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large: max ${Math.round(maxSize / 1024 / 1024)}MB` },
        { status: 400 },
      )
    }

    if (!process.env.CLOUDFLARE_BUCKET_NAME) {
      throw new Error("CLOUDFLARE_BUCKET_NAME is not set")
    }

    // SVG та ICO проходять без обробки, решта стискається у WebP
    const passthroughExt = PASSTHROUGH_TYPES[file.type]
    let buffer: Buffer
    let mimeType: string
    let extension: string

    if (passthroughExt) {
      buffer = Buffer.from(await file.arrayBuffer())
      mimeType = file.type
      extension = passthroughExt
    } else {
      const processed = await processImage(file)
      buffer = processed.buffer
      mimeType = processed.mimeType
      extension = "webp"
    }

    const folder = S3_FOLDERS[uploadType] || "default"
    const s3Key = buildKey(folder, extension)

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType,
        // Ім'я унікальне, тому кешувати можна назавжди
        CacheControl: "public, max-age=31536000, immutable",
      }),
    )

    const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${s3Key}`
    console.log("[upload] ok:", s3Key, buffer.length, "bytes")

    return NextResponse.json({
      url: publicUrl,
      type: "s3",
      filename: s3Key.split("/").pop(),
    })
  } catch (error) {
    console.error("[upload] failed:", error)
    const message = error instanceof Error ? error.message : "Failed to process file"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
