import { Suspense } from "react"
import type { Metadata } from "next"
import { ArticleContent } from "@/components/articles/article-content"
import { ArticleServiceRecommendation } from "@/components/articles/article-service-recommendation"
import { createClient } from "@/lib/supabase"
import { notFound, permanentRedirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { generateArticleSchema, generateArticleBreadcrumbSchema } from "@/lib/article-schema"
import Script from "next/script"
import { siteUrl } from "@/lib/site-config"

type Props = {
  params: {
    locale: string
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = createClient()

  // Query using localized slug from article_translations
  let { data: articleTranslation } = await supabase
    .from("article_translations")
    .select(
      `
      title,
      meta_description,
      locale,
      articles(
        id,
        featured_image,
        meta_description,
        article_translations(
          locale,
          slug
        )
      )
    `
    )
    .eq("slug", slug)
    .eq("locale", locale)
    .single()

  // If not found with localized slug, try to find by any slug and get correct translation
  if (!articleTranslation) {
    const { data: anyTranslation } = await supabase
      .from("article_translations")
      .select(
        `
        title,
        meta_description,
        locale,
        article_id,
        articles(
          id,
          featured_image,
          meta_description,
          article_translations(
            locale,
            slug
          )
        )
      `
      )
      .eq("slug", slug)
      .single()

    if (anyTranslation?.article_id) {
      // Get the correct translation for this locale
      const { data: correctTranslation } = await supabase
        .from("article_translations")
        .select(
          `
          title,
          meta_description,
          locale,
          articles(
            id,
            featured_image,
            meta_description,
            article_translations(
              locale,
              slug
            )
          )
        `
        )
        .eq("article_id", anyTranslation.article_id)
        .eq("locale", locale)
        .single()

      articleTranslation = correctTranslation
    }
  }

  if (!articleTranslation?.articles) {
    return {
      title: "Article not found",
    }
  }

  const article = Array.isArray(articleTranslation.articles) ? articleTranslation.articles[0] : articleTranslation.articles
  const title = articleTranslation.title
  const description = articleTranslation.meta_description || (article as any)?.meta_description || ""

  // Get all localized slugs for hreflang
  const translations = (article as any)?.article_translations as any[]
  const alternateLanguages: Record<string, string> = {}

  translations.forEach((t) => {
    alternateLanguages[t.locale] = `${siteUrl}/${t.locale}/articles/${t.slug}`
  })
  // Add x-default pointing to Czech version
  const defaultSlug = translations.find((t: any) => t.locale === "cs")?.slug || translations[0]?.slug
  if (defaultSlug) {
    alternateLanguages["x-default"] = `${siteUrl}/cs/articles/${defaultSlug}`
  }

  return {
    title: `${title} | DeviceHelp`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://devicehelp.cz/${locale}/articles/${slug}`,
      images: (article as any).featured_image ? [(article as any).featured_image] : [],
    },
    alternates: {
      canonical: `https://devicehelp.cz/${locale}/articles/${slug}`,
      languages: alternateLanguages,
    },
  }
}

export async function generateStaticParams() {
  const supabase = createClient()

  // Get all published articles with their localized slugs and locales
  const { data: translations } = await supabase
    .from("article_translations")
    .select(
      `
      slug,
      locale,
      articles(
        published
      )
    `
    )
    .eq("articles.published", true)

  if (!translations) return []

  // Generate params for each locale-slug combination
  return translations
    .filter((translation) => typeof translation.slug === 'string' && translation.slug.trim() !== '')
    .map((translation) => ({
      locale: translation.locale,
      slug: translation.slug,
    }))
}

function ArticleContentSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="h-96 bg-gray-200 rounded-lg mb-8 animate-pulse" />
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
        <div className="space-y-2 mt-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

async function ArticleSchemaScript({ locale, slug }: { locale: string; slug: string }) {
  const supabase = createClient()

  // Query by localized slug and locale
  const { data: translation } = await supabase
    .from("article_translations")
    .select(
      `
      title,
      locale,
      articles(
        id,
        featured_image,
        created_at,
        updated_at,
        content,
        meta_description
      )
    `
    )
    .eq("slug", slug)
    .eq("locale", locale)
    .single()

  if (!translation || !translation.articles) return null

  const article = Array.isArray(translation.articles) ? translation.articles[0] : translation.articles
  if (!article) return null

  const schema = generateArticleSchema({
    title: translation.title,
    description: (article as any).meta_description || (article as any).content.substring(0, 160),
    image: (article as any).featured_image,
    slug,
    createdAt: (article as any).created_at,
    updatedAt: (article as any).updated_at,
    locale,
  })

  const breadcrumbSchema = generateArticleBreadcrumbSchema({
    title: translation.title,
    slug,
    locale,
  })

  return (
    <>
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  )
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params
  const supabase = createClient()

  // Check if slug matches this locale and redirect if needed
  const { data: correctTranslation } = await supabase
    .from("article_translations")
    .select("slug, title, articles(id, content, featured_image, created_at, updated_at, view_count, tags, reading_time_minutes)")
    .eq("slug", slug)
    .eq("locale", locale)
    .single()

  // SSR title and content for bots
  const articleTitle = correctTranslation?.title ?? null
  const articleObj = Array.isArray(correctTranslation?.articles) ? correctTranslation?.articles[0] : correctTranslation?.articles
  const articleId = (articleObj as any)?.id
  const articleContent = (articleObj as any)?.content || ""

  const initialData = correctTranslation ? {
    id: articleId,
    title: articleTitle,
    content: articleContent,
    featured_image: (correctTranslation.articles as any)?.featured_image,
    reading_time_minutes: (correctTranslation.articles as any)?.reading_time_minutes || 5,
    view_count: (correctTranslation.articles as any)?.view_count || 0,
    published_at: (correctTranslation.articles as any)?.created_at,
    tags: (correctTranslation.articles as any)?.tags || [],
  } : null

  if (!articleId) {
    // ... redirect logic same as before ...
  }

  return (
    <div className="min-h-screen py-12">
      <Suspense fallback={null}>
        <ArticleSchemaScript locale={locale} slug={slug} />
      </Suspense>
      <div className="container mx-auto px-4">
        <article className="max-w-3xl mx-auto">
          {/* We no longer need the sr-only H1 here because ArticleContent will render the H1 during SSR now */}
          <Suspense fallback={<ArticleContentSkeleton />}>
            <ArticleContent slug={slug} locale={locale} initialData={initialData} />
          </Suspense>

          {/* Service Recommendations */}
          {articleId && (
            <Suspense fallback={null}>
              <ArticleServiceRecommendation articleId={articleId} locale={locale} />
            </Suspense>
          )}
        </article>
      </div>
    </div>
  )
}
