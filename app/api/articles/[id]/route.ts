import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { generateReadingTime, generateMetaDescription } from "@/lib/articles"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const locale = request.nextUrl.searchParams.get("locale") || "cs"

    const supabase = createClient()

    const { data: article, error } = await supabase
      .from("articles")
      .select(
        `
        *,
        article_translations(
          id,
          article_id,
          locale,
          title,
          content,
          meta_description,
          created_at,
          updated_at
        ),
        article_service_links(
          id,
          service_id,
          position
        )
      `
      )
      .eq("id", id)
      .single()

    if (error || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error("Error fetching article:", error)
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()
    const body = await request.json()

    const { 
      title, 
      content, 
      featured_image, 
      featured, 
      published, 
      slug, 
      meta_description, 
      reading_time_minutes,
      translations = []
    } = body

    // Calculate reading time if not provided
    const readingTime = reading_time_minutes || generateReadingTime(content)
    const metaDesc = meta_description || generateMetaDescription(content)

    const { data: article, error } = await supabase
      .from("articles")
      .update({
        ...(title && { title }),
        ...(slug && { slug }),
        content,
        featured_image: featured_image || null,
        featured: featured || false,
        published: published || false,
        reading_time_minutes: readingTime,
        meta_description: metaDesc,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    // Update translations
    if (translations && translations.length > 0) {
      for (const trans of translations) {
        const { data: existing } = await supabase
          .from("article_translations")
          .select("id")
          .eq("article_id", id)
          .eq("locale", trans.locale)
          .single()

        if (existing) {
          // Update existing translation
          await supabase
            .from("article_translations")
            .update({
              title: trans.title,
              content: trans.content,
              meta_description: trans.meta_description || metaDesc,
            })
            .eq("id", existing.id)
        } else {
          // Insert new translation
          if (trans.content || trans.title) {
            await supabase
              .from("article_translations")
              .insert({
                article_id: id,
                locale: trans.locale,
                title: trans.title,
                content: trans.content,
                meta_description: trans.meta_description || metaDesc,
              })
          }
        }
      }
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error("Error updating article:", error)
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { error } = await supabase.from("articles").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting article:", error)
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 })
  }
}
