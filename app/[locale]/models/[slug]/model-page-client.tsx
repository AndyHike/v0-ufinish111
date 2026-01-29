"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Clock, Shield, ArrowRight } from "lucide-react"
import { formatImageUrl } from "@/utils/image-url"
import { useEffect, useRef, useState } from "react"
import { ServicePriceDisplay } from "@/components/service-price-display"
import { ContactCTABanner } from "@/components/contact-cta-banner"
import { PartTypeBadges } from "@/components/part-type-badges"
import { Breadcrumb } from "@/components/breadcrumb"
import { useGlobalData } from "@/hooks/use-global-data"
import useSWR from "swr"

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
    part_type: string | null
    discounted_price?: number | null
    has_discount?: boolean
    discount?: any
    actual_discount_percentage?: number | null // Added actual discount percentage to interface
  }>
}

interface Props {
  modelData: ModelData
  locale: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ModelPageClient({ modelData, locale }: Props) {
  const t = useTranslations("Models")
  const commonT = useTranslations("Common")
  const viewContentSent = useRef(false)
  const { setCachedModel } = useGlobalData()
  const [mounted, setMounted] = useState(false)

  // SWR для кешування та фонового оновлення
  const { data: currentModelData = modelData, isLoading } = useSWR(
    `/api/models/${currentModelData.slug}?locale=${locale}`,
    fetcher,
    {
      fallbackData: modelData,
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  )

  useEffect(() => {
    setMounted(true)
    // Зберігаємо в контекст для наступних навігацій
    if (currentModelData && currentModelData.slug) {
      setCachedModel(currentModelData.slug, currentModelData)
    }
  }, [currentModelData, setCachedModel])

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[v0] Model services loaded:", currentModelData.services.length)
      currentModelData.services.forEach((service) => {
        if (service.has_discount) {
          console.log(`[v0] Service "${service.name}" has discount:`, {
            originalPrice: service.price,
            discountedPrice: service.discounted_price,
            discount: service.discount,
            actualDiscountPercentage: service.actual_discount_percentage,
          })
        }
      })
    }
  }, [currentModelData])

  useEffect(() => {
    if (viewContentSent.current) return

    const sendFbqEvent = () => {
      if (typeof window === "undefined" || !window.fbq) return

      const servicesWithPrice = currentModelData.services.filter((s) => s.price !== null && s.price !== undefined)
      const avgPrice =
        servicesWithPrice.length > 0
          ? servicesWithPrice.reduce((sum, s) => sum + (s.price || 0), 0) / servicesWithPrice.length
          : 0

      const brandName = currentModelData.brands?.name || "Unknown"
      const modelName = currentModelData.name
      const contentName = `${brandName} ${modelName}`

      window.fbq("track", "ViewContent", {
        content_type: "product",
        content_id: `model_${currentModelData.id}`,
        content_name: contentName,
        content_category: "device_models",
        value: Math.round(avgPrice) || 0,
        currency: "CZK",
      })

      if (process.env.NODE_ENV === "development") {
        console.log("📊 Model ViewContent:", {
          brand: brandName,
          model: modelName,
          avg_price: Math.round(avgPrice) || 0,
          services_count: currentModelData.services.length,
        })
      }

      viewContentSent.current = true
    }

    const timeoutId = setTimeout(sendFbqEvent, 100)
    return () => clearTimeout(timeoutId)
  }, [modelData])

  const formatWarranty = (months: number | null, period: string | null) => {
    if (months === null || months === undefined) return t("contactForWarranty")
    return period === "days" ? t("warrantyDays", { count: months }) : t("warrantyMonths", { count: months })
  }

  const formatDuration = (hours: number | null) => {
    if (hours === null || hours === undefined) return t("contactForTime")
    return t("fromHours", { hours })
  }

  const handleServiceClick = (service: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔗 Navigating to service:", service.name)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              ...(currentModelData.brands ? [{ label: currentModelData.brands.name, href: `/${locale}/brands/${currentModelData.brands.slug}` }] : []),
              ...(currentModelData.series ? [{ label: currentModelData.series.name, href: `/${locale}/series/${currentModelData.series.slug}` }] : []),
              { label: currentModelData.name, href: `/${locale}/models/${currentModelData.slug}` },
            ]}
          />
        </div>

        {/* Компактний Hero блок - горизонтальний банер */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center gap-6">
            {/* Зображення пристрою - зменшене */}
            <div className="flex-shrink-0">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-white shadow-sm">
                <img
                  src={formatImageUrl(currentModelData.image_url) || "/placeholder.svg?height=80&width=80&query=phone"}
                  alt={currentModelData.name}
                  className="h-full w-full object-contain p-2"
                />
              </div>
            </div>

            {/* Інформація про модель */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {currentModelData.brands?.logo_url && (
                  <img
                    src={formatImageUrl(currentModelData.brands.logo_url) || "/placeholder.svg"}
                    alt={currentModelData.brands.name}
                    className="h-4 w-4 object-contain"
                  />
                )}
                <span className="text-gray-600 font-medium">{currentModelData.brands?.name}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{currentModelData.name}</h1>
              <p className="text-gray-600">{t("professionalRepair")}</p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("availableServices")}</h2>

          {currentModelData.services.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentModelData.services.map((service) => (
                <Link
                  key={service.id}
                  href={`/${locale}/services/${service.slug}?model=${currentModelData.slug}`}
                  className="group block"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300 group-hover:-translate-y-1">
                    {/* Service Image with Part Type Badges */}
                    <div className="relative h-48 bg-white border-b border-gray-100 p-4 flex items-center justify-center">
                      {/* Part Type Badges - верхній лівий кут */}
                      {service.part_type && (
                        <div className="absolute top-2 left-2 z-10">
                          <PartTypeBadges
                            partTypeString={service.part_type}
                            containerClassName="flex-col gap-1"
                          />
                        </div>
                      )}

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

                      {/* Key Benefits */}
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

                      {/* Price and CTA */}
                      <div className="flex items-center justify-between">
                        {service.price !== null && service.price !== undefined ? (
                          <ServicePriceDisplay
                            originalPrice={service.price}
                            discountedPrice={service.discounted_price || undefined}
                            hasDiscount={service.has_discount}
                            discount={service.discount}
                            actualDiscountPercentage={service.actual_discount_percentage || undefined} // Pass actual percentage to display component
                            size="md"
                            showBadge={true}
                          />
                        ) : (
                          <div className="text-xl font-bold text-gray-900">{t("priceOnRequest")}</div>
                        )}
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
                  href={`/${locale}/contact?model=${encodeURIComponent(currentModelData.name)}`}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {commonT("contactUs")}
                </Link>
              </div>
            </div>
          )}
        </div>

        {currentModelData.services.length > 0 && <ContactCTABanner locale={locale} variant="compact" />}
      </div>
    </div>
  )
}
