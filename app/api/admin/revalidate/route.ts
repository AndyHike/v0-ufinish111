"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createServerClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get("authorization")
    const sessionId = request.cookies.get("session_id")?.value

    if (!authHeader?.startsWith("Bearer ") && !sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { path, tag, type } = body as { path?: string; tag?: string; type?: string }

    console.log("[v0] Cache revalidation requested:", { path, tag, type })

    // Option 1: Clear specific path
    if (path) {
      revalidatePath(path, "page")
      console.log(`[v0] Revalidated path: ${path}`)
    }

    // Option 2: Clear by tag
    if (tag) {
      revalidateTag(tag)
      console.log(`[v0] Revalidated tag: ${tag}`)
    }

    // Option 3: Clear all content based on type
    if (type === "brands") {
      revalidatePath("/", "layout")
      // Re-render all brand pages for all locales
      const locales = ["cs", "uk", "en"]
      for (const locale of locales) {
        revalidatePath(`/${locale}/brands`, "page")
      }
      console.log("[v0] Revalidated all brand pages")
    }

    if (type === "series") {
      const locales = ["cs", "uk", "en"]
      for (const locale of locales) {
        revalidatePath(`/${locale}/series`, "page")
      }
      console.log("[v0] Revalidated all series pages")
    }

    if (type === "models") {
      const locales = ["cs", "uk", "en"]
      for (const locale of locales) {
        revalidatePath(`/${locale}/models`, "page")
      }
      console.log("[v0] Revalidated all model pages")
    }

    // Option 4: Global cache purge
    if (!path && !tag && !type) {
      revalidatePath("/", "layout")
      console.log("[v0] Full cache purge triggered")
    }

    return NextResponse.json({
      success: true,
      message: "Cache revalidation completed",
      revalidated: { path, tag, type },
    })
  } catch (error) {
    console.error("[v0] Error in revalidate API:", error)
    return NextResponse.json(
      { error: "Failed to revalidate cache", details: String(error) },
      { status: 500 }
    )
  }
}
