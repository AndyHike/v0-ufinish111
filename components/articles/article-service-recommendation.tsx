"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { stripMarkdown } from "@/lib/markdown-utils"

type Service = {
  id: string
  slug: string
  name: string
  image_url?: string
  services_translations?: Array<{
    locale: string
    name: string
    description: string
  }>
}

export function ArticleServiceRecommendation({
  articleId,
  locale,
}: {
  articleId: string
  locale: string
}) {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslations("Articles")

  useEffect(() => {
    fetchServices()
  }, [articleId, locale])

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/articles/${articleId}/services`)
      if (!response.ok) throw new Error("Failed to fetch services")

      const links = await response.json()
      
      // Extract services from links - array of { id, service_id, position, services: {...} }
      const serviceList = links
        .filter((link: any) => link.services)
        .map((link: any) => link.services)
      
      setServices(serviceList)
    } catch (error) {
      console.error("Error fetching services:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || services.length === 0) {
    return null
  }

  return (
    <section className="my-12 py-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
      <div className="max-w-3xl mx-auto px-6">
        <h3 className="text-2xl font-bold mb-6">{t("relatedServices")}</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service) => {
            const translation = service.services_translations?.find(
              (t) => t.locale === locale
            )
            const serviceName = translation?.name || service.name

            return (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                {service.image_url && (
                  <div className="relative w-full h-32 overflow-hidden bg-gray-100">
                    <img
                      src={service.image_url}
                      alt={serviceName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">{serviceName}</h4>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {stripMarkdown(translation?.description || "Professional service")}
                  </p>
                  <Link href={`/${locale}/services/${service.slug}`}>
                    <Button size="sm" className="w-full gap-2">
                      {t("orderNow")}
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
