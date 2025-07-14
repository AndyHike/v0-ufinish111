"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Clock, Shield, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import { formatImageUrl } from "@/utils/image-url"
import { useEffect } from "react"

interface ModelData {
  id: string
  name: string
  slug: string | null
  image_url: string | null
  brands: {
    id: string
    name: string
    slug: string | null
    logo_url: string | null
  } | null
  series: {
    id: string
    name: string
    slug: string | null
  } | null
  services: Array<{
    id: string
    slug: string | null
    name: string
    description: string
    price: number | null
    position: number
    warranty_months: number | null
    duration_hours: number | null
    warranty_period: string | null
    image_url: string | null
    detailed_description: string | null
    what_included: string | null
    benefits: string | null
  }>
}

interface Props {
  modelData: ModelData
  locale: string
}

export default function ModelPageClient({ modelData, locale }: Props) {
  const t = useTranslations("Models")
  const commonT = useTranslations("Common")

  // Facebook Pixel - ViewContent для сторінки моделі
  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      const avgPrice =
        modelData.services.length > 0
          ? modelData.services.filter((s) => s.price !== null).reduce((sum, s) => sum + (s.price || 0), 0) /
            modelData.services.filter((s) => s.price !== null).length
          : 0

      window.fbq("track", "ViewContent", {
        content_type: "product",
        content_name: `${modelData.brands?.name} ${modelData.name}`,
        content_category: "device_model",
        value: avgPrice || 0,
        currency: "CZK",
        custom_parameters: {
          model_id: modelData.id,
          model_name: modelData.name,
          brand_name: modelData.brands?.name || "unknown",
          series_name: modelData.series?.name || "unknown",
          services_count: modelData.services.length,
        },
      })
    }
  }, [modelData])

  // ВИПРАВЛЕНО: Правильна логіка форматування гарантії з перевіркою на null/undefined
  const formatWarranty = (months: number | null, period: string | null) => {
    if (months === null || months === undefined) return t("contactForWarranty")
    return period === "days" ? t("warrantyDays", { count: months }) : t("warrantyMonths", { count: months })
  }

  // ВИПРАВЛЕНО: Правильна логіка форматування тривалості з перевіркою на null/undefined
  const formatDuration = (hours: number | null) => {
    if (hours === null || hours === undefined) return t("contactForTime")
    return t("fromHours", { hours })
  }

  const handleServiceClick = (service: any) => {
    // Facebook Pixel - відстеження кліку на послугу
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_type: "service",
        content_name: service.name,
        content_category: "repair_service",
        value: service.price || 0,
        currency: "CZK",
        custom_parameters: {
          service_id: service.id,
          model_name: modelData.name,
          brand_name: modelData.brands?.name || "unknown",
        },
      })
    }
  }

  console.log(
    "[MODEL CLIENT] Services data:",
    modelData.services.map((s) => ({
      name: s.name,
      warranty_months: s.warranty_months,
      warranty_months_type: typeof s.warranty_months,
      duration_hours: s.duration_hours,
      duration_hours_type: typeof s.duration_hours,
      price: s.price,
      price_type: typeof s.price,
      warranty_period: s.warranty_period,
    })),
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500">
          <Link href={`/${locale}/brands/${modelData.brands?.slug}`} className="hover:text-blue-600 transition-colors">
            {modelData.brands?.name}
          </Link>
          {modelData.series && (
            <>
              <span className="mx-2">/</span>
              <Link
                href={`/${locale}/series/${modelData.series.slug}`}
                className="hover:text-blue-600 transition-colors"
              >
                {modelData.series.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-900">{modelData.name}</span>
        </nav>

        {/* Компактний Hero блок - горизонтальний банер */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center gap-6">
            {/* Зображення пристрою - зменшене */}
            <div className="flex-shrink-0">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-white shadow-sm">
                <img
                  src={formatImageUrl(modelData.image_url) || "/placeholder.svg?height=80&width=80&query=phone"}
                  alt={modelData.name}
                  className="h-full w-full object-contain p-2"
                />
              </div>
            </div>

            {/* Інформація про модель */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {modelData.brands?.logo_url && (
                  <img
                    src={formatImageUrl(modelData.brands.logo_url) || "/placeholder.svg"}
                    alt={modelData.brands.name}
                    className="h-4 w-4 object-contain"
                  />
                )}
                <span className="text-gray-600 font-medium">{modelData.brands?.name}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{modelData.name}</h1>
              <p className="text-gray-600">{t("professionalRepair")}</p>
            </div>
          </div>
        </div>

        {/* Services Grid - виправлене відображення фото */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("availableServices")}</h2>

          {modelData.services.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modelData.services.map((service) => (
                <Link
                  key={service.id}
                  href={`/${locale}/services/${service.slug}?model=${modelData.slug}`}
                  className="group block"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300 group-hover:-translate-y-1">
                    {/* Service Image - виправлене відображення без обрізання */}
                    <div className="h-48 bg-white border-b border-gray-100 p-4 flex items-center justify-center">
                      {service.image_url ? (
                        <img
                          src={formatImageUrl(service.image_url) || "/placeholder.svg"}
                          alt={service.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                          <div className="text-center p-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                              <div className="w-5 h-5 bg-blue-600 rounded-sm"></div>
                            </div>
                            <p className="text-gray-500 font-medium text-sm">{service.name}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Service Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {service.name}
                      </h3>

                      {/* Key Benefits - ВИПРАВЛЕНО: використовуємо правильно конвертовані дані з model_services */}
                      <div className="mb-3 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span>{formatDuration(service.duration_hours)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Shield className="h-3 w-3 text-green-600" />
                          <span>{formatWarranty(service.warranty_months, service.warranty_period)}</span>
                        </div>
                      </div>

                      {/* Price and CTA - ВИПРАВЛЕНО: правильна перевірка ціни */}
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-gray-900">
                          {service.price !== null && service.price !== undefined
                            ? formatCurrency(service.price)
                            : t("priceOnRequest")}
                        </div>
                        <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                          <span className="mr-1 text-sm">{commonT("details")}</span>
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-6 h-6 bg-gray-400 rounded-sm"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("servicesInDevelopment")}</h3>
                <p className="text-gray-600 mb-6">{t("servicesNotAddedYet")}</p>
                <Link
                  href={`/${locale}/contact?model=${encodeURIComponent(modelData.name)}`}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {commonT("contactUs")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
