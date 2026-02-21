"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Article = {
  id: string
  slug: string
  title: string
  featured_image?: string
  reading_time_minutes: number
  view_count: number
}

export function RelatedArticles({
  currentSlug,
  locale,
}: {
  currentSlug: string
  locale: string
}) {
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRelated()
  }, [currentSlug, locale])

  const fetchRelated = async () => {
    try {
      const response = await fetch(`/api/articles?locale=${locale}&limit=100`)
      if (!response.ok) throw new Error("Failed to fetch articles")

      const data = await response.json()
      const related = data.articles
        .filter((a: any) => a.slug !== currentSlug)
        .slice(0, 3)

      setArticles(related)
    } catch (error) {
      console.error("Error fetching related articles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || articles.length === 0) {
    return null
  }

  return (
    <section className="mt-12 pt-8 border-t">
      <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
      <div className="grid md:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Card key={article.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 line-clamp-2">{article.title}</h4>
              <p className="text-xs text-gray-500 mb-4">
                {article.reading_time_minutes} min read
              </p>
              <Link href={`/${locale}/articles/${article.slug}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Read More
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
