import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as unknown as File

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    // Add support for logo and favicon file types
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

    // In the POST handler, add validation based on upload type:
    const uploadType = (formData.get("type") as string) || "default"
    const allowedFileTypes = allowedTypes[uploadType as keyof typeof allowedTypes] || allowedTypes.default
    const maxFileSize = maxSizes[uploadType as keyof typeof maxSizes] || maxSizes.default

    if (!allowedFileTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = Date.now() + "-" + file.name.replaceAll(" ", "_")
    const uploadDir = path.join(process.cwd(), "public", "uploads")

    await writeFile(`${uploadDir}/${filename}`, buffer)

    return NextResponse.json({ data: { filename } })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
