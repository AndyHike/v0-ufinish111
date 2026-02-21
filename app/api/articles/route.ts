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

    const { slug, title, content, featured_image, featured, published } = body

    if (!slug || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const { data: article, error } = await supabase
      .from("articles")
      .insert({
        slug,
        title,
        content,
        featured_image,
        featured: featured || false,
        published: published || false,
        meta_description: content.substring(0, 155),
        reading_time_minutes: Math.ceil(
          content.replace(/<[^>]*>/g, "").split(/\s+/).length / 200
        ),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    console.error("Error creating article:", error)
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    )
  }
}
