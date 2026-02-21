"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Clock, Eye, Tag, Calendar, ShoppingCart } from "lucide-react"
import { ArticleContentSkeleton } from "./article-content-skeleton"
import { motion } from "framer-motion"

type Article = {
  id: string
  slug: string
  title: string
  featured_image?: string
  reading_time_minutes: number
  view_count: number
  content: string
  article_service_links?: Array<{ service_id: string }>
}

type Service = {
  id: string
  slug: string
  title: string
  description: string
}

export function ArticleContent({ slug, locale }: { slug: string; locale: string }) {
  const [article, setArticle] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [relatedServices, setRelatedServices] = useState<Service[]>([])
  const [primaryService, setPrimaryService] = useState<Service | null>(null)
  const [isNavVisible, setIsNavVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [navHeight, setNavHeight] = useState(80) // Default height of mobile nav
  const t = useTranslations("Articles")

  useEffect(() => {
    // Calculate mobile nav height dynamically
    const updateNavHeight = () => {
      const mobileNav = document.querySelector('[class*="md:hidden"][class*="fixed"][class*="bottom-0"]')
      if (mobileNav) {
        setNavHeight(mobileNav.getBoundingClientRect().height)
      }
    }

    updateNavHeight()
    window.addEventListener('resize', updateNavHeight)
    return () => window.removeEventListener('resize', updateNavHeight)
  }, [])

  useEffect(() => {
    fetchArticle()
  }, [slug, locale])

  useEffect(() => {
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

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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

      // Set primary service if available
      if (fullArticle.primary_service_id) {
        try {
          const servicesResponse = await fetch(`/api/services?locale=${locale}&limit=100`)
          if (servicesResponse.ok) {
            const servicesData = await servicesResponse.json()
            const primarySvc = (servicesData.services || []).find(
              (service: Service) => service.id === fullArticle.primary_service_id
            )
            if (primarySvc) {
              setPrimaryService(primarySvc)
            }
          }
        } catch (err) {
          console.error("Failed to fetch primary service:", err)
        }
      }

      // Fetch related services if article has service links
      if (fullArticle.article_service_links && fullArticle.article_service_links.length > 0) {
        try {
          // Filter out invalid UUIDs before making the request
          const validLinks = fullArticle.article_service_links.filter((link: any) => 
            link.service_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(link.service_id)
          )
          
          if (validLinks.length > 0) {
            const servicesResponse = await fetch(`/api/services?locale=${locale}&limit=100`)
            if (servicesResponse.ok) {
              const servicesData = await servicesResponse.json()
              const linkedServices = (servicesData.services || []).filter((service: Service) =>
                validLinks.some((link: any) => link.service_id === service.id)
              )
              setRelatedServices(linkedServices)
            }
          }
        } catch (err) {
          console.error("Failed to fetch related services:", err)
        }
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

      <div
        className="prose prose-sm md:prose-base lg:prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Related Services CTA */}
      {relatedServices.length > 0 && (
        <div className="mt-12 pt-8 border-t">
          <h3 className="text-2xl font-bold mb-6">{t("relatedServices")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedServices.map((service) => (
              <a
                key={service.id}
                href={`/services/${service.slug}`}
                className="block p-6 border rounded-lg hover:border-blue-500 hover:shadow-lg transition group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-lg group-hover:text-blue-600 transition">
                    {service.title}
                  </h4>
                  <ShoppingCart className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" />
                </div>
                <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm font-medium">
                  {t("orderNow")}
                </button>
              </a>
            ))}
          </div>
        </div>
      )}
    </article>

    {/* Sticky CTA Button for Primary Service */}
    {primaryService && (
      <motion.div
        className="fixed bottom-0 md:bottom-8 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-4xl bg-white border border-gray-200 rounded-none md:rounded-xl shadow-xl hover:shadow-2xl z-40 px-4 py-4 md:px-6 md:py-5 transition-all duration-300"
        animate={{ translateY: window.innerWidth < 768 ? (isNavVisible ? 0 : -navHeight) : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-full">
          {/* Mobile version - compact */}
          <div className="md:hidden flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">{t("relatedServices")}</p>
              <p className="font-semibold text-sm line-clamp-1 text-gray-900 mt-1">{primaryService.title}</p>
            </div>
            <a
              href={`/services/${primaryService.slug}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm whitespace-nowrap flex-shrink-0 shadow-md hover:shadow-lg"
            >
              {t("orderNow")}
            </a>
          </div>

          {/* Desktop version - full card */}
          <div className="hidden md:block">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{t("relatedServices")}</p>
                <p className="font-bold text-lg text-gray-900 mt-2">{primaryService.title}</p>
                {primaryService.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{primaryService.description}</p>
                )}
              </div>
              <a
                href={`/services/${primaryService.slug}`}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold text-center shadow-md hover:shadow-lg"
              >
                {t("orderNow")}
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </>
  )
}
