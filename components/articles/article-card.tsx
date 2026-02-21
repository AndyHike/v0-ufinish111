"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Clock, Eye } from "lucide-react"
import { useTranslations } from "next-intl"

type ArticleCardProps = {
  id: string
  slug: string
  title: string
  featured_image?: string
  reading_time_minutes: number
  view_count: number
  content: string
  locale: string
  tags?: string[]
  published_at?: string
  category?: string
}

export function ArticleCard({
  slug,
  title,
  featured_image,
  reading_time_minutes,
  view_count,
  content,
  locale,
  tags = [],
  published_at,
  category,
}: ArticleCardProps) {
  const t = useTranslations("Articles")
  
  // Extract first 150 characters for preview
  const preview = content
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .substring(0, 150)
    .trim()

  // Format date
  const formattedDate = published_at
    ? new Date(published_at).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'cs-CZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <Link href={`/${locale}/articles/${slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        {featured_image && (
          <div className="relative w-full h-48 overflow-hidden bg-gray-100">
            <img
              src={featured_image}
              alt={title}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </div>
        )}
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold line-clamp-2 hover:text-blue-600">
                {title}
              </h3>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2">{preview}</p>

            {category && (
              <div className="pt-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  {category}
                </Badge>
              </div>
            )}

            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
                {tags.length > 2 && (
                  <span className="text-xs text-gray-500">+{tags.length - 2}</span>
                )}
              </div>
            )}

            {formattedDate && (
              <div className="text-xs text-gray-500 pt-2">
                {t("publishedDate")}: {formattedDate}
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{t("readingTime", { minutes: reading_time_minutes })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{t("views", { count: view_count })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
