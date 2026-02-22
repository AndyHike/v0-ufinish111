import { createClient } from "@/lib/supabase"

export interface Article {
  id: string
  slug: string
  title: string
  content: string
  meta_description?: string
  featured: boolean
  published: boolean
  view_count: number
  reading_time_minutes: number
  featured_image?: string
  created_at: string
  updated_at: string
}

export interface ArticleTranslation {
  id: string
  article_id: string
  locale: string
  title: string
  content: string
  meta_description?: string
  slug: string // Localized slug for this language
  created_at: string
  updated_at: string
}

export interface ArticleServiceLink {
  id: string
  article_id: string
  service_id: string
  position: number
  created_at: string
}

// Generate reading time from content (average 200 words per minute)
export function generateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

// Generate meta description from content (first 155 characters)
export function generateMetaDescription(content: string): string {
  const text = content
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()

  return text.substring(0, 155) + (text.length > 155 ? "..." : "")
}

// Fetch single article by localized slug and locale
export async function getArticleBySlug(
  slug: string,
  locale: string = "cs"
): Promise<(Article & { translation?: ArticleTranslation }) | null> {
  const supabase = createClient()

  // Query by localized slug from article_translations
  let { data: translation, error: translationError } = await supabase
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
        article_translations(
          locale,
          title,
          slug
        )
      )
    `
    )
    .eq("slug", slug)
    .eq("locale", locale)
    .eq("articles.published", true)
    .single()

  // Fallback: якщо локалізований slug не знайдений, шукаємо за основним slug
  if (translationError || !translation?.articles) {
    const { data: article } = await supabase
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
          slug,
          created_at,
          updated_at
        )
      `
      )
      .eq("slug", slug)
      .eq("published", true)
      .single()

    if (!article) return null

    const trans = (article.article_translations as ArticleTranslation[])?.find(
      (t: ArticleTranslation) => t.locale === locale
    )

    return {
      ...article,
      translation: trans,
    }
  }

  const article = translation.articles

  return {
    ...article,
    translation,
  }
}

// Fetch all published articles with optional pagination
export async function getArticles(
  locale: string = "cs",
  page: number = 1,
  limit: number = 10,
  featured: boolean = false
) {
  const supabase = createClient()

  let query = supabase
    .from("articles")
    .select(
      `
      id,
      slug,
      title,
      content,
      meta_description,
      featured,
      view_count,
      reading_time_minutes,
      featured_image,
      tags,
      category,
      primary_service_id,
      created_at,
      updated_at,
      article_translations(
        locale,
        title,
        content,
        meta_description
      )
    `,
      { count: "exact" }
    )
    .eq("published", true)

  if (featured) {
    query = query.eq("featured", true)
  }

  const offset = (page - 1) * limit
  const { data: articles, error, count } = await query
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching articles:", error)
    return { articles: [], total: 0 }
  }

  // Filter articles with translation for specific locale
  const articlesWithTranslations = articles.map((article) => {
    const translation = (article.article_translations as ArticleTranslation[])?.find(
      (t: ArticleTranslation) => t.locale === locale
    )
    return {
      ...article,
      translation,
    }
  })

  return { articles: articlesWithTranslations, total: count || 0 }
}

// Get articles by service
export async function getArticlesByService(serviceId: string, locale: string = "cs") {
  const supabase = createClient()

  const { data: links, error: linksError } = await supabase
    .from("article_service_links")
    .select("article_id")
    .eq("service_id", serviceId)
    .order("position")

  if (linksError || !links) return []

  const articleIds = links.map((link: ArticleServiceLink) => link.article_id)
  if (articleIds.length === 0) return []

  const { data: articles } = await supabase
    .from("articles")
    .select(
      `
      *,
      article_translations(
        locale,
        title,
        content,
        meta_description
      )
    `
    )
    .in("id", articleIds)
    .eq("published", true)

  if (!articles) return []

  return articles.map((article) => {
    const translation = (article.article_translations as ArticleTranslation[])?.find(
      (t: ArticleTranslation) => t.locale === locale
    )
    return {
      ...article,
      translation,
    }
  })
}

// Increment view count
export async function incrementArticleViews(articleId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("articles")
    .update({ view_count: supabase.rpc("increment", { x: 1 }) })
    .eq("id", articleId)

  if (error) {
    console.error("Error incrementing views:", error)
  }
}

// Get related articles (same category/tag in future, for now just random published)
export async function getRelatedArticles(
  currentArticleId: string,
  locale: string = "cs",
  limit: number = 3
) {
  const supabase = createClient()

  const { data: articles } = await supabase
    .from("articles")
    .select(
      `
      id,
      slug,
      title,
      featured_image,
      reading_time_minutes,
      view_count,
      article_translations(
        locale,
        title
      )
    `
    )
    .eq("published", true)
    .neq("id", currentArticleId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (!articles) return []

  return articles.map((article) => {
    const translation = (article.article_translations as ArticleTranslation[])?.find(
      (t: ArticleTranslation) => t.locale === locale
    )
    return {
      ...article,
      translation,
    }
  })
}
