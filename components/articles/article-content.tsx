"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Clock, Eye, Tag, Calendar } from "lucide-react"

type Article = {
  id: string
  slug: string
  title: string
  featured_image?: string
  reading_time_minutes: number
  view_count: number
  content: string
}

export function ArticleContent({ slug, locale }: { slug: string; locale: string }) {
  const [article, setArticle] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations("Articles")

  useEffect(() => {
    fetchArticle()
  }, [slug, locale])

  const fetchArticle = async () => {
    try {
      // Find article by slug and get all data including translations
      const listResponse = await fetch(`/api/articles?locale=${locale}&limit=1000`)
      if (!listResponse.ok) throw new Error("Failed to fetch articles")

      const listData = await listResponse.json()
      const articleBase = listData.articles.find((a: any) => a.slug === slug)

      if (!articleBase) throw new Error("Article not found")

      // Fetch full article with translations
      const fullResponse = await fetch(`/api/articles/${articleBase.id}`)
      if (!fullResponse.ok) throw new Error("Failed to fetch article details")

      const fullArticle = await fullResponse.json()

      // Get translation for current locale or fallback to main article
      const translation = (fullArticle.article_translations as any[])?.find(
        (t) => t.locale === locale
      )

      const displayArticle = {
        ...fullArticle,
        title: translation?.title || fullArticle.title,
        content: translation?.content || fullArticle.content,
      }

      setArticle(displayArticle)

      // Increment view count
      await fetch(`/api/articles/${fullArticle.id}/views`, {
        method: "POST",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading article...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">Error: {error}</div>
  }

  if (!article) {
    return <div className="text-center py-12">Article not found</div>
  }

  return (
    <article className="max-w-3xl mx-auto">
      {article.featured_image && (
        <img
          src={article.featured_image}
          alt={article.title}
          className="w-full h-96 object-cover rounded-lg mb-8"
        />
      )}

      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        
        {/* Теги */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.map((tag: string) => (
              <span key={tag} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Метаінформація */}
        <div className="flex flex-wrap gap-4 text-gray-600 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{t("readingTime", { minutes: article.reading_time_minutes })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{t("views", { count: article.view_count })}</span>
          </div>
          {article.published_at && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(article.published_at).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'cs-CZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className="prose prose-sm md:prose-base lg:prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  )
}
