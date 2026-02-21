"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Edit, Trash2, Plus, Eye } from "lucide-react"
import Link from "next/link"
import { useLocale } from "next-intl"

type Article = {
  id: string
  slug: string
  title: string
  featured: boolean
  published: boolean
  view_count: number
  reading_time_minutes: number
  created_at: string
  updated_at: string
}

export function ArticlesManagement() {
  const t = useTranslations("Admin")
  const { toast } = useToast()
  const locale = useLocale()

  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const response = await fetch(`/api/articles?limit=100`)
      if (!response.ok) throw new Error("Failed to fetch articles")
      const data = await response.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to load articles",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete article")

      setArticles(articles.filter((a) => a.id !== id))
      toast({
        title: "Success",
        description: "Article deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Articles Management</h2>
        <Link href={`/${locale}/admin/articles/create`}>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Article
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {articles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No articles yet</p>
            </CardContent>
          </Card>
        ) : (
          articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{article.title}</h3>
                    <p className="text-sm text-gray-500">/{article.slug}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>Views: {article.view_count}</span>
                      <span>Reading time: {article.reading_time_minutes} min</span>
                      <span>
                        {article.published ? "Published" : "Draft"}
                        {article.featured && " • Featured"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/${locale}/articles/${article.slug}`} target="_blank">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/${locale}/admin/articles/${article.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-red-600"
                      onClick={() => handleDelete(article.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
