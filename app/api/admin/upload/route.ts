import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"

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

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Define allowed types and max sizes based on upload type
    const allowedTypes = {
      logo: ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"],
      favicon: ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/svg+xml"],
      default: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
    }

    const maxSizes = {
      logo: 5 * 1024 * 1024, // 5MB
      favicon: 1024 * 1024, // 1MB
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
    const buffer = Buffer.from(arrayBuffer)

    // Generate a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `${uploadType}/${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`

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

    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
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
