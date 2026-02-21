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
}

export function ArticleCard({
  slug,
  title,
  featured_image,
  reading_time_minutes,
  view_count,
  content,
  locale,
}: ArticleCardProps) {
  const t = useTranslations("Articles")
  
  // Extract first 150 characters for preview
  const preview = content
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .substring(0, 150)
    .trim()

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
