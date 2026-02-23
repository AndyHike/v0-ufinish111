import { Suspense } from "react"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase"
import { getTranslations } from "next-intl/server"
import { ArticlesHero } from "@/components/articles/articles-hero"
import { ArticleCard } from "@/components/articles/article-card"
import { siteUrl } from "@/lib/site-config"

type Props = {
  params: {
    locale: string
  }
  searchParams: {
    search?: string
    page?: string
    sort?: string
    category?: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Articles" })

  return {
    title: `${t("title")} | ${t("metaTitleSuffix") || "DeviceHelp Articles"}`,
    description: t("subtitle"),
    alternates: {
      canonical: `${siteUrl}/${locale}/articles`,
      languages: {
        cs: `${siteUrl}/cs/articles`,
        en: `${siteUrl}/en/articles`,
        uk: `${siteUrl}/uk/articles`,
        "x-default": `${siteUrl}/cs/articles`,
      },
    },
  }
}

function ArticlesListSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
  )
}

async function ArticlesList({ locale, search, sort, category }: { locale: string; search?: string; sort?: string; category?: string }) {
  const supabase = createClient()

  let query = supabase
    .from("articles")
    .select(
      `
      id,
      slug,
      title,
      content,
      featured_image,
      reading_time_minutes,
      view_count,
      featured,
      tags,
      category,
      published_at,
      article_translations(
        locale,
        title,
        content
      )
    `
    )
    .eq("published", true)
    .order("featured", { ascending: false })

  // Apply filtering by category
  if (category) {
    query = query.eq("category", category)
  }

  // Apply sorting
  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true })
  } else if (sort === "popular") {
    query = query.order("view_count", { ascending: false }).order("created_at", { ascending: false })
  } else {
    // Default to newest
    query = query.order("created_at", { ascending: false })
  }

  if (search) {
    // Check if search starts with # for tag search
    const searchTerm = search.toLowerCase().trim()
    if (searchTerm.startsWith("#")) {
      // Tag search - remove # and search in tags array using contains
      const tagToSearch = searchTerm.substring(1).toLowerCase()
      // For PostgreSQL array, use contains with array syntax
      query = query.contains("tags", [tagToSearch])
    } else {
      // Regular title search
      query = query.ilike("title", `%${search}%`)
    }
  }

  const { data: articles, error } = await query.limit(100)

  if (error || !articles) {
    return <div className="text-center py-12">No articles found</div>
  }

  // Filter by locale translation or fallback to main title
  const articlesWithLocale = articles.map((article) => {
    const translation = (article.article_translations as any[])?.find(
      (t) => t.locale === locale
    )
    return {
      ...article,
      displayTitle: translation?.title || article.title,
      displayContent: translation?.content || article.content,
    }
  })

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articlesWithLocale.map((article) => (
        <ArticleCard
          key={article.id}
          id={article.id}
          slug={article.slug}
          title={article.displayTitle}
          featured_image={article.featured_image}
          reading_time_minutes={article.reading_time_minutes}
          view_count={article.view_count}
          content={article.displayContent}
          locale={locale}
          tags={article.tags}
          published_at={article.published_at}
          category={article.category}
        />
      ))}
    </div>
  )
}

export default async function ArticlesPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { search, sort, category } = await searchParams

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <ArticlesHero locale={locale} search={search} sort={sort} />
        </div>
      </section>

      {/* Articles Grid */}
      <section className="pb-8 md:pb-12">
        <div className="container mx-auto px-4">
          <Suspense fallback={<ArticlesListSkeleton />}>
            <ArticlesList locale={locale} search={search} sort={sort} category={category} />
          </Suspense>
        </div>
      </section>
    </div>
  )
}
