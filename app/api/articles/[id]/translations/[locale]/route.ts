import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { generateMetaDescription } from "@/lib/articles"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; locale: string }> }
) {
  try {
    const { id, locale } = await params
    const supabase = createClient()
    const body = await request.json()

    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const metaDescription = generateMetaDescription(content)

    const { data: translation, error } = await supabase
      .from("article_translations")
      .update({
        title,
        content,
        meta_description: metaDescription,
        updated_at: new Date().toISOString(),
      })
      .eq("article_id", id)
      .eq("locale", locale)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(translation)
  } catch (error) {
    console.error("Error updating translation:", error)
    return NextResponse.json(
      { error: "Failed to update translation" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; locale: string }> }
) {
  try {
    const { id, locale } = await params
    const supabase = createClient()

    const { error } = await supabase
      .from("article_translations")
      .delete()
      .eq("article_id", id)
      .eq("locale", locale)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting translation:", error)
    return NextResponse.json(
      { error: "Failed to delete translation" },
      { status: 500 }
    )
  }
}
