"use client"

import { useEffect, useState } from "react"

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

  useEffect(() => {
    fetchArticle()
  }, [slug, locale])

  const fetchArticle = async () => {
    try {
      // Find article by slug
      const listResponse = await fetch(`/api/articles?locale=${locale}&limit=1000`)
      if (!listResponse.ok) throw new Error("Failed to fetch articles")

      const listData = await listResponse.json()
      const article = listData.articles.find((a: any) => a.slug === slug)

      if (!article) throw new Error("Article not found")

      setArticle(article)

      // Increment view count
      await fetch(`/api/articles/${article.id}/views`, {
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
        <div className="flex gap-6 text-gray-600">
          <span>Reading time: {article.reading_time_minutes} min</span>
          <span>Views: {article.view_count}</span>
        </div>
      </div>

      <div
        className="prose prose-sm md:prose-base lg:prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  )
}
