import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const locale = searchParams.get("locale") || "cs"

    if (!query || query.length < 2) {
      return NextResponse.json({
        tags: [],
        categories: [],
        articles: [],
      })
    }

    const supabase = createClient()
    const queryLower = query.toLowerCase()

    // Fetch all published articles with translations for current locale
    const { data: articles } = await supabase
      .from("articles")
      .select(
        `
        id,
        slug,
        title,
        tags,
        category,
        content,
        featured_image,
        reading_time_minutes,
        article_translations(
          locale,
          title,
          content
        )
      `
      )
      .eq("published", true)
      .limit(100)

    // Extract unique tags from all articles
    const allTags = new Set<string>()
    const allCategories = new Set<string>()

    articles?.forEach((article: any) => {
      if (Array.isArray(article.tags)) {
        article.tags.forEach((tag: string) => {
          if (tag.toLowerCase().includes(queryLower)) {
            allTags.add(tag)
          }
        })
      }
      if (article.category && article.category.toLowerCase().includes(queryLower)) {
        allCategories.add(article.category)
      }
    })

    // Search articles by title, tags, content, and category
    const matchingArticles = articles
      ?.filter((article: any) => {
        const translation = article.article_translations?.find(
          (t: any) => t.locale === locale
        )
        const title = translation?.title || article.title
        const content = translation?.content || article.content
        const titleMatch = title.toLowerCase().includes(queryLower)
        const contentMatch = content.toLowerCase().includes(queryLower)
        const tagsMatch =
          Array.isArray(article.tags) &&
          article.tags.some((tag: string) => tag.toLowerCase().includes(queryLower))
        const categoryMatch =
          article.category && article.category.toLowerCase().includes(queryLower)

        return titleMatch || contentMatch || tagsMatch || categoryMatch
      })
      .map((article: any) => {
        const translation = article.article_translations?.find(
          (t: any) => t.locale === locale
        )
        return {
          id: article.id,
          slug: article.slug,
          title: translation?.title || article.title,
          category: article.category,
          reading_time: article.reading_time_minutes,
          featured_image: article.featured_image,
        }
      })
      .slice(0, 5) // Limit to 5 results

    return NextResponse.json({
      tags: Array.from(allTags).slice(0, 5),
      categories: Array.from(allCategories).slice(0, 5),
      articles: matchingArticles || [],
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    )
  }
}
