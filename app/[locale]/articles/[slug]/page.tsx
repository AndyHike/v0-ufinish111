import { Suspense } from "react"
import type { Metadata } from "next"
import { ArticleContent } from "@/components/articles/article-content"
import { ArticleContentSkeleton } from "@/components/articles/article-content-skeleton"
import { createClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { generateArticleSchema, generateArticleBreadcrumbSchema } from "@/lib/article-schema"
import Script from "next/script"

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

  const article = articleTranslation.articles
  const title = articleTranslation.title
  const description = articleTranslation.meta_description || article.meta_description || ""

  // Get all localized slugs for hreflang
  const translations = article.article_translations as any[]
  const alternateLanguages: Record<string, string> = {}
  
  translations.forEach((t) => {
    alternateLanguages[t.locale] = `https://devicehelp.cz/${t.locale}/articles/${t.slug}`
  })

  return {
    title: `${title} | DeviceHelp`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: article.featured_image ? [article.featured_image] : [],
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
  return translations.map((translation) => ({
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

  if (!translation?.articles) return null

  const article = translation.articles

  const schema = generateArticleSchema({
    title: translation.title,
    description: article.meta_description || article.content.substring(0, 160),
    image: article.featured_image,
    slug,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
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

  // Check if the current slug is the correct localized slug for this language
  // If not, redirect to the correct localized slug
  const { data: correctTranslation } = await supabase
    .from("article_translations")
    .select("slug, articles(id)")
    .eq("slug", slug)
    .eq("locale", locale)
    .single()

  // If the slug exists for this locale, use it. Otherwise, find the article by any slug
  // and redirect to the correct localized slug for this locale
  let articleId = correctTranslation?.articles?.id

  if (!articleId) {
    // Try to find the article by searching for this slug in any locale
    const { data: anyTranslation } = await supabase
      .from("article_translations")
      .select("articles(id)")
      .eq("slug", slug)
      .single()

    if (anyTranslation?.articles?.id) {
      articleId = anyTranslation.articles.id

      // Now find the correct slug for the target locale
      const { data: targetTranslation } = await supabase
        .from("article_translations")
        .select("slug")
        .eq("article_id", articleId)
        .eq("locale", locale)
        .single()

      if (targetTranslation?.slug && targetTranslation.slug !== slug) {
        const { redirect } = await import("next/navigation")
        redirect(`/${locale}/articles/${targetTranslation.slug}`)
      }
    }
  }

  return (
    <div className="min-h-screen py-12">
      <Suspense fallback={null}>
        <ArticleSchemaScript locale={locale} slug={slug} />
      </Suspense>
      <div className="container mx-auto px-4">
        <article className="max-w-3xl mx-auto">
          <Suspense fallback={<ArticleContentSkeleton />}>
            <ArticleContent slug={slug} locale={locale} />
          </Suspense>
        </article>
      </div>
    </div>
  )
}
