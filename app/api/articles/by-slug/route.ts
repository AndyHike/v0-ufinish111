import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get("slug")
    const locale = searchParams.get("locale") || "cs"

    if (!slug) {
      return NextResponse.json(
        { error: "Missing required parameter: slug" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Query article by localized slug from article_translations
    const { data: translation, error: translationError } = await supabase
      .from("article_translations")
      .select(
        `
        id,
        article_id,
        locale,
        title,
        content,
        meta_description,
        slug,
        created_at,
        updated_at,
        articles(
          id,
          slug,
          title,
          content,
          meta_description,
          featured,
          published,
          view_count,
          reading_time_minutes,
          featured_image,
          tags,
          category,
          primary_service_id,
          created_at,
          updated_at,
          article_service_links(
            id,
            service_id,
            position
          ),
          article_translations(
            locale,
            title,
            content,
            slug
          )
        )
      `
      )
      .eq("slug", slug)
      .eq("locale", locale)
      .eq("articles.published", true)
      .single()

    if (translationError || !translation?.articles) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      )
    }

    const article = translation.articles

    return NextResponse.json({
      id: article.id,
      slug: article.slug,
      title: translation.title,
      content: translation.content,
      meta_description: translation.meta_description || article.meta_description,
      featured: article.featured,
      published: article.published,
      view_count: article.view_count,
      reading_time_minutes: article.reading_time_minutes,
      featured_image: article.featured_image,
      tags: article.tags,
      category: article.category,
      primary_service_id: article.primary_service_id,
      created_at: article.created_at,
      updated_at: article.updated_at,
      article_service_links: article.article_service_links,
      article_translations: article.article_translations,
    })
  } catch (error) {
    console.error("Error fetching article by slug:", error)
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    )
  }
}
