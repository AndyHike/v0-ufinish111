"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Clock, Eye, Tag, Calendar } from "lucide-react"
import { ArticleContentSkeleton } from "./article-content-skeleton"
import { formatContent, generateTableOfContents } from "@/lib/content-formatter"

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

  const fetchArticle = async () => {
    try {
      // Fetch article directly by localized slug and locale
      const response = await fetch(`/api/articles/by-slug?slug=${encodeURIComponent(slug)}&locale=${locale}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch article`)
      }

      const fullArticle = await response.json()

      const displayArticle = {
        ...fullArticle,
        title: fullArticle.title,
        content: fullArticle.content,
      }

      setArticle(displayArticle)

      // Fetch all services once
      try {
        const servicesResponse = await fetch(`/api/services?locale=${locale}&limit=100`)
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json()
          const allServices = servicesData.services || []

          // Filter services that are linked to this article
          if (fullArticle.article_service_links && fullArticle.article_service_links.length > 0) {
            const linkedServiceIds = fullArticle.article_service_links
              .map((link: any) => link.service_id)
              .filter((id: string) => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))

            const filtered = allServices.filter((service: Service) =>
              linkedServiceIds.includes(service.id)
            )
            setRelatedServices(filtered)
          }

          // Set primary service if available
          if (fullArticle.primary_service_id) {
            const primary = allServices.find((service: Service) => service.id === fullArticle.primary_service_id)
            if (primary) {
              setPrimaryService(primary)
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch services:", err)
      }

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

  useEffect(() => {
    fetchArticle()
  }, [slug, locale])

  // Calculate mobile nav height and track scroll
  useEffect(() => {
    const calculateNavHeight = () => {
      const mobileNav = document.querySelector('[class*="md:hidden"][class*="fixed"][class*="bottom"]')
      if (mobileNav) {
        setNavHeight(mobileNav.getBoundingClientRect().height)
      }
    }

    calculateNavHeight()
    window.addEventListener('resize', calculateNavHeight)

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show nav when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsNavVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavVisible(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('resize', calculateNavHeight)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  if (isLoading) {
    return <ArticleContentSkeleton />
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">Error: {error}</div>
  }

  if (!article) {
    return <div className="text-center py-12">Article not found</div>
  }

  return (
    <>
      <article className="max-w-3xl mx-auto pb-32 md:pb-0">
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

        {/* Table of Contents */}
        {(() => {
          const toc = generateTableOfContents(article.content)
          return toc.length > 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 text-blue-900">Зміст статті</h3>
              <ul className="space-y-2">
                {toc.map((item) => (
                  <li key={item.id} style={{ marginLeft: `${(item.level - 2) * 1.5}rem` }}>
                    <a
                      href={`#${item.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        })()}

        <div
          className="prose prose-sm md:prose-base lg:prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
        />
      </article>
    </>
  )
}
