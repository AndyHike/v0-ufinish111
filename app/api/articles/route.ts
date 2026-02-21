import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getArticles, getRelatedArticles } from "@/lib/articles"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const locale = searchParams.get("locale") || "cs"
    const featured = searchParams.get("featured") === "true"

    const { articles, total } = await getArticles(locale, page, limit, featured)

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching articles:", error)
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { 
      slug, 
      title, 
      content, 
      featured_image, 
      featured, 
      published,
      published_at,
      tags = [],
      reading_time_minutes,
      meta_description,
      translations = []
    } = body

    if (!slug || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title, content" },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      )
    }

    // Calculate reading time if not provided
    const calcReadingTime = reading_time_minutes || Math.ceil(
      content.replace(/<[^>]*>/g, "").split(/\s+/).length / 200
    )
    
    // Generate meta description if not provided
    const calcMetaDescription = meta_description || 
      content.replace(/<[^>]*>/g, "").substring(0, 155)

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .insert({
        slug,
        title,
        content,
        featured_image: featured_image || null,
        featured: featured || false,
        published: published || false,
        published_at: published_at || null,
        tags: tags || [],
        meta_description: calcMetaDescription,
        reading_time_minutes: calcReadingTime,
      })
      .select()
      .single()

    if (articleError) throw articleError

    // Add translations if provided
    if (translations && translations.length > 0) {
      const translationInserts = translations
        .filter((t: any) => t.content || t.title)
        .map((t: any) => ({
          article_id: article.id,
          locale: t.locale,
          title: t.title || title,
          content: t.content || content,
          meta_description: t.meta_description || calcMetaDescription,
        }))

      if (translationInserts.length > 0) {
        const { error: translationError } = await supabase
          .from("article_translations")
          .insert(translationInserts)

        if (translationError) throw translationError
      }
    }

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    console.error("Error creating article:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create article" },
      { status: 500 }
    )
  }
}
