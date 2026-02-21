import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    // Get current view count and increment
    const { data: article, error: fetchError } = await supabase
      .from("articles")
      .select("view_count")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    const newCount = (article?.view_count || 0) + 1

    const { error } = await supabase
      .from("articles")
      .update({ view_count: newCount })
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ view_count: newCount })
  } catch (error) {
    console.error("Error incrementing views:", error)
    return NextResponse.json({ error: "Failed to increment views" }, { status: 500 })
  }
}
