import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { generateMetaDescription } from "@/lib/articles"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { data: translations, error } = await supabase
      .from("article_translations")
      .select("*")
      .eq("article_id", id)

    if (error) throw error

    return NextResponse.json(translations || [])
  } catch (error) {
    console.error("Error fetching translations:", error)
    return NextResponse.json({ error: "Failed to fetch translations" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()
    const body = await request.json()

    const { locale, title, content } = body

    if (!locale || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if translation exists
    const { data: existing } = await supabase
      .from("article_translations")
      .select("id")
      .eq("article_id", id)
      .eq("locale", locale)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Translation already exists for this locale" },
        { status: 400 }
      )
    }

    const metaDescription = generateMetaDescription(content)

    const { data: translation, error } = await supabase
      .from("article_translations")
      .insert({
        article_id: id,
        locale,
        title,
        content,
        meta_description: metaDescription,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(translation, { status: 201 })
  } catch (error) {
    console.error("Error creating translation:", error)
    return NextResponse.json(
      { error: "Failed to create translation" },
      { status: 500 }
    )
  }
}
