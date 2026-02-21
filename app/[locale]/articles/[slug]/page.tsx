import { Suspense } from "react"
import type { Metadata } from "next"
import { ArticleContent } from "@/components/articles/article-content"
import { RelatedArticles } from "@/components/articles/related-articles"
import { ArticleServiceRecommendation } from "@/components/articles/article-service-recommendation"
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

  const { data: article } = await supabase
    .from("articles")
    .select(
      `
      id,
      title,
      meta_description,
      featured_image,
      slug,
      article_translations(
        locale,
        title,
        meta_description
      )
    `
    )
    .eq("slug", slug)
    .eq("published", true)
    .single()

  if (!article) {
    return {
      title: "Article not found",
    }
  }

  const translation = (article.article_translations as any[])?.find(
    (t) => t.locale === locale
  )
  const title = translation?.title || article.title
  const description = translation?.meta_description || article.meta_description || ""

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
      languages: {
        cs: `https://devicehelp.cz/cs/articles/${slug}`,
        uk: `https://devicehelp.cz/uk/articles/${slug}`,
        en: `https://devicehelp.cz/en/articles/${slug}`,
      },
    },
  }
}

export async function generateStaticParams() {
  const supabase = createClient()

  const { data: articles } = await supabase
    .from("articles")
    .select("slug")
    .eq("published", true)

  if (!articles) return []

  return articles.flatMap((article) => [
    { locale: "cs", slug: article.slug },
    { locale: "uk", slug: article.slug },
    { locale: "en", slug: article.slug },
  ])
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

  const { data: article } = await supabase
    .from("articles")
    .select(
      `
      id,
      title,
      content,
      meta_description,
      featured_image,
      created_at,
      updated_at
    `
    )
    .eq("slug", slug)
    .eq("published", true)
    .single()

  if (!article) return null

  const schema = generateArticleSchema({
    title: article.title,
    description: article.meta_description || article.content.substring(0, 160),
    image: article.featured_image,
    slug,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
    locale,
  })

  const breadcrumbSchema = generateArticleBreadcrumbSchema({
    title: article.title,
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

          {/* Service Recommendations */}
          <Suspense fallback={null}>
            <ArticleServiceRecommendation articleId={slug} locale={locale} />
          </Suspense>

          {/* Related Articles */}
          <Suspense fallback={null}>
            <RelatedArticles currentSlug={slug} locale={locale} />
          </Suspense>
        </article>
      </div>
    </div>
  )
}
