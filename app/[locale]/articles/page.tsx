import { Suspense } from "react"
import type { Metadata } from "next"
import { Input } from "@/components/ui/input"
import { ArticleCard } from "@/components/articles/article-card"
import { createClient } from "@/lib/supabase"
import { getTranslations } from "next-intl/server"
import { useTranslations } from "next-intl"

type Props = {
  params: {
    locale: string
  }
  searchParams: {
    search?: string
    page?: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params
  const t = await getTranslations({ locale, namespace: "Articles" })

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `https://devicehelp.cz/${locale}/articles`,
      languages: {
        cs: "https://devicehelp.cz/cs/articles",
        uk: "https://devicehelp.cz/uk/articles",
        en: "https://devicehelp.cz/en/articles",
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

async function ArticlesList({ locale, search }: { locale: string; search?: string }) {
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
      article_translations(
        locale,
        title
      )
    `
    )
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })

  if (search) {
    query = query.ilike("title", `%${search}%`)
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
          content={article.content}
          locale={locale}
        />
      ))}
    </div>
  )
}

export default function ArticlesPage({ params, searchParams }: Props) {
  const { locale } = params
  const { search } = searchParams
  const t = useTranslations("Articles")

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t("title")}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {t("subtitle")}
            </p>

            {/* Search */}
            <div className="relative">
              <form action="" method="get" className="flex gap-2">
                <Input
                  type="search"
                  name="search"
                  placeholder={t("searchPlaceholder")}
                  defaultValue={search || ""}
                  className="flex-1"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {t("searchButton")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Suspense fallback={<ArticlesListSkeleton />}>
            <ArticlesList locale={locale} search={search} />
          </Suspense>
        </div>
      </section>
    </div>
  )
}

"use client"

function ArticlesPageClient() {
  const t = useTranslations("Articles")
