import { type NextRequest, NextResponse } from "next/server"
import { revalidateCache } from "@/lib/cache/supabase-cache"
import { getCurrentUser } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  try {
    // Перевіряємо, чи користувач адміністратор
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tags } = await request.json()

    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json({ error: "Tags array is required" }, { status: 400 })
    }

    // Очищуємо кеш для вказаних тегів
    await revalidateCache(tags)

    return NextResponse.json({
      success: true,
      message: `Cache revalidated for tags: ${tags.join(", ")}`,
    })
  } catch (error) {
    console.error("Error revalidating cache:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
