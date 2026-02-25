"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Breadcrumb } from "@/components/breadcrumb"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Phone, MessageCircle, Clock, Shield, CheckCircle, ChevronDown, ArrowLeft } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import { formatImageUrl } from "@/utils/image-url"
import { replaceFaqPlaceholders } from "@/lib/faq-placeholder-replacer"
import { useEffect, useRef, useState, Suspense } from "react"
import { ServicePriceDisplay } from "@/components/service-price-display"
import { ContactCTABanner } from "@/components/contact-cta-banner"
import { PartTypeBadges } from "@/components/part-type-badges"

interface ServiceData {
  id: string
  position: number
  warranty_months: number | null
  duration_hours: number | null
  warranty_period: string
  image_url: string | null
  slug: string | null
  translation: {
    name: string
    description: string
    detailed_description: string | null
    what_included: string | null
    benefits: string | null
  }
  faqs: Array<{
    id: string
    position: number
    translation: {
      question: string
      answer: string
    }
  }>
  sourceModel: {
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
    category?: { name: string } | null
    categories?: Array<{ name: string }> | null
    product_line?: string | null
    type?: string | null
  } | null
  modelServicePrice: number | null
  minPrice: number | null
  maxPrice: number | null
  discountedPrice?: number | null
  hasDiscount?: boolean
  discount?: any
  part_type?: string | null
  modelSlug?: string | null // Параметр модель з URL
}

interface Props {
  serviceData: ServiceData
  locale: string
}

export default function ServicePageClient(props: Props) {
  return (
    <Suspense fallback={<ServicePageClientSkeleton />}>
      <ServicePageClientContent {...props} />
    </Suspense>
  )
}

function ServicePageClientSkeleton() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl text-center">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mx-auto mb-4"></div>
        <div className="h-4 w-96 bg-gray-200 animate-pulse rounded mx-auto"></div>
      </div>
    </div>
  )
}

function ServicePageClientContent({ serviceData, locale }: Props) {
  const t = useTranslations("Services")
  const commonT = useTranslations("Common")
  const brandsT = useTranslations("Brands")
  const searchParams = useSearchParams()
  const viewContentSent = useRef(false)
  const [mounted, setMounted] = useState(false)

  // Показуємо помилку тільки якщо немає даних
  if (!serviceData) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-lg text-muted-foreground">Не вдалося завантажити дані про послугу. Спробуйте оновити сторінку.</p>
        </div>
      </div>
    )
  }

  const {
    translation,
    faqs,
    sourceModel,
    modelServicePrice,
    minPrice,
    maxPrice,
    discountedPrice,
    hasDiscount,
    discount,
    modelSlug,
  } = serviceData

  // Використовуємо modelSlug з пропса, якщо він є, інакше беремо з search params для зворотної сумісності
  const modelParam = modelSlug || searchParams.get("model")

  const whatIncludedList = translation.what_included?.split("\n").filter((item) => item.trim()) || []
  const benefitsList = translation.benefits?.split("\n").filter((item) => item.trim()) || []

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Перевіряємо чи ми на клієнті ТА чи не відправляли подію раніше
    if (!mounted || viewContentSent.current) return

    // Виконуємо тільки після монтування компонента на клієнті
    const sendFbqEvent = () => {
      if (typeof window === "undefined" || !window.fbq) return

      const actualPrice =
        modelParam && modelServicePrice !== null && modelServicePrice !== undefined
          ? modelServicePrice
          : minPrice !== null && maxPrice !== null
            ? minPrice === maxPrice
              ? minPrice
              : (minPrice + maxPrice) / 2
            : null

      const brandName = sourceModel?.brands?.name || "Unknown"
      const modelName = sourceModel?.name || modelParam || "Unknown"
      const serviceName = translation.name
      const contentName = `${serviceName} - ${brandName} ${modelName}`

      window.fbq("track", "ViewContent", {
        content_type: "product",
        content_id: `service_${serviceData.id}`,
        content_name: contentName,
        content_category: "repair_services",
        value: actualPrice || 0,
        currency: "CZK",
      })

      if (process.env.NODE_ENV === "development") {
        console.log("📊 Service ViewContent:", {
          service: serviceName,
          brand: brandName,
          model: modelName,
          price: actualPrice || 0,
        })
      }

      viewContentSent.current = true
    }

    // Додаємо невеликий таймаут щоб гарантувати що fbq завантажився
    const timeoutId = setTimeout(sendFbqEvent, 100)
    return () => clearTimeout(timeoutId)
  }, [mounted, serviceData.id, translation.name, modelParam, modelServicePrice, minPrice, maxPrice])

  const formatWarranty = (months: number | null, period: string) => {
    if (months === null || months === undefined) return t("contactForWarranty")
    return period === "days" ? t("warrantyDays", { count: months }) : t("warrantyMonths", { count: months })
  }

  const formatDuration = (hours: number | null) => {
    if (hours === null || hours === undefined) return t("contactForTime")
    return t("fromHours", { hours })
  }

  // Допоміжна функція для форматування гарантії для плейсхолдерів
  const getFormattedWarrantyForPlaceholder = (months: number | null, period: string) => {
    if (months === null || months === undefined) return ""
    return period === "days" ? t("warrantyDays", { count: months }) : t("warrantyMonths", { count: months })
  }

  // Допоміжна функція для форматування тривалості для плейсхолдерів
  const getFormattedDurationForPlaceholder = (hours: number | null) => {
    if (hours === null || hours === undefined) return ""
    // Форматуємо без префіксу "~", тільки число + одиниці виміру
    const hoursText = hours === 1 ? t("hour") : t("hours")
    return `${hours} ${hoursText}`
  }

  const handleOrderClick = () => {
    if (typeof window === "undefined" || !window.fbq) return

    const actualPrice =
      modelParam && modelServicePrice !== null && modelServicePrice !== undefined
        ? modelServicePrice
        : minPrice !== null && maxPrice !== null
          ? minPrice === maxPrice
            ? minPrice
            : (minPrice + maxPrice) / 2
          : null

    const brandName = sourceModel?.brands?.name || "Unknown"
    const modelName = sourceModel?.name || modelParam || "Unknown"
    const contentName = `${translation.name} - ${brandName} ${modelName}`

    window.fbq("track", "InitiateCheckout", {
      content_type: "product",
      content_id: `service_${serviceData.id}`,
      content_name: contentName,
      content_category: "repair_services",
      value: actualPrice || 0,
      currency: "CZK",
    })

    if (process.env.NODE_ENV === "development") {
      console.log("📊 InitiateCheckout:", {
        service: translation.name,
        brand: brandName,
        model: modelName,
        price: actualPrice || 0,
      })
    }
  }

  // Підготовка значень для замісткі плейсхолдерів
  const placeholderValues = {
    model: sourceModel?.name || modelParam || "",
    brand: sourceModel?.brands?.name || "",
    service: translation.name || "",
    category: sourceModel?.category?.name || sourceModel?.categories?.[0]?.name || "",
    line: sourceModel?.product_line || "",
    // Для гарантії: передаємо сформатовану з перекладом
    warrantyCounted: getFormattedWarrantyForPlaceholder(serviceData.warranty_months, serviceData.warranty_period),
    warranty: getFormattedWarrantyForPlaceholder(serviceData.warranty_months, serviceData.warranty_period),
    warrantyMonths: serviceData.warranty_months || undefined,
    // Для ціни: якщо вибрана конкретна модель, використовуємо ціну цієї моделі або "за запитом"
    // Якщо модель не вибрана, використовуємо мінімальну ціну з діапазону
    price: modelParam
      ? (modelServicePrice ? formatCurrency(modelServicePrice) : t("priceOnRequest"))
      : (minPrice ? formatCurrency(minPrice) : t("priceOnRequest")),
    // Для тривалості: передаємо сформатовану з перекладом
    durationFormatted: getFormattedDurationForPlaceholder(serviceData.duration_hours),
    duration: getFormattedDurationForPlaceholder(serviceData.duration_hours),
    durationHours: serviceData.duration_hours || undefined,
    fullModel: sourceModel ? `${sourceModel.brands?.name || ""} ${sourceModel.name}`.trim() : modelParam || "",
    productType: sourceModel?.type || "",
  }

  // Обробка FAQ для підстановки плейсхолдерів
  const processedFaqs = faqs.map((faq) => ({
    ...faq,
    translation: {
      question: replaceFaqPlaceholders(faq.translation.question, placeholderValues),
      answer: replaceFaqPlaceholders(faq.translation.answer, placeholderValues),
    },
  }))

  const bookingUrl = (() => {
    const params = new URLSearchParams()

    if (serviceData.slug) {
      params.set("service_slug", serviceData.slug)
    }

    if (sourceModel?.slug) {
      params.set("model_slug", sourceModel.slug)
    } else if (modelParam) {
      params.set("model_slug", modelParam)
    }

    // Add warranty and duration if available
    if (serviceData.warranty_months) {
      params.set("warranty_months", serviceData.warranty_months.toString())
    }
    if (serviceData.duration_hours) {
      params.set("duration_hours", serviceData.duration_hours.toString())
    }

    return `/${locale}/book?${params.toString()}`
  })()

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: brandsT("allBrands") || "Всі бренди", href: `/${locale}/brands` },
              ...(sourceModel?.brands ? [{ label: sourceModel.brands.name, href: `/${locale}/brands/${sourceModel.brands.slug}` }] : []),
              ...(sourceModel?.series ? [{ label: sourceModel.series.name, href: `/${locale}/series/${sourceModel.series.slug}` }] : []),
              ...(sourceModel ? [{ label: sourceModel.name, href: `/${locale}/models/${sourceModel.slug}` }] : []),
              { label: translation.name, href: `#` },
            ]}
          />
        </div>

        {/* Адаптивний макет - мобільний/планшет одна колонка, великі екрани дві */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Ліва колонка - зображення (контрольована висота) */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex-shrink-0"
              style={{ aspectRatio: "4/3", maxHeight: "300px" }}>
              {/* Part Type Badges - верхній лівий кут */}
              {serviceData.part_type && (
                <div className="absolute top-2 left-2 z-10">
                  <PartTypeBadges
                    partTypeString={serviceData.part_type}
                    containerClassName="flex-col gap-1"
                  />
                </div>
              )}

              {serviceData.image_url ? (
                <img
                  src={formatImageUrl(serviceData.image_url) || "/placeholder.svg"}
                  alt={translation.name}
                  className="w-full h-full object-contain bg-white"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">{translation.name}</h3>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Права колонка - основна інформація (3 колонки з 5) */}
          <div className="lg:col-span-3 space-y-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{translation.name}</h1>
              <p className="text-gray-600 leading-relaxed">
                {translation.detailed_description || translation.description}
              </p>
            </div>

            {/* Ціна */}
            <div>
              {modelParam ? (
                // Коли вибрана конкретна модель - показуємо ціну лише для цієї моделі або "за запитом"
                serviceData.modelServicePrice !== null && serviceData.modelServicePrice !== undefined ? (
                  <ServicePriceDisplay
                    originalPrice={serviceData.modelServicePrice}
                    discountedPrice={discountedPrice || undefined}
                    hasDiscount={hasDiscount}
                    discount={discount}
                    size="lg"
                    showBadge={true}
                    priceOnRequest={false}
                  />
                ) : (
                  <ServicePriceDisplay
                    originalPrice={null}
                    size="lg"
                    priceOnRequest={true}
                  />
                )
              ) : (
                // Коли модель не вибрана - показуємо діапазон цін
                minPrice !== null && maxPrice !== null ? (
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                    {minPrice === maxPrice
                      ? formatCurrency(minPrice)
                      : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                  </div>
                ) : (
                  <ServicePriceDisplay
                    originalPrice={null}
                    size="lg"
                    priceOnRequest={true}
                  />
                )
              )}
              {(sourceModel || modelParam) && (
                <p className="text-gray-600 text-sm">
                  {sourceModel
                    ? t("forModel", { brand: sourceModel.brands?.name || "", model: sourceModel.name })
                    : t("forSpecificModel")}
                </p>
              )}
            </div>

            {/* Компактні переваги */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t("executionTime")}</div>
                  <div className="text-xs text-gray-600">{formatDuration(serviceData.duration_hours)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t("warranty")}</div>
                  <div className="text-xs text-gray-600">
                    {formatWarranty(serviceData.warranty_months, serviceData.warranty_period)}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 py-3" asChild>
                <Link href={bookingUrl} onClick={handleOrderClick}>
                  <Phone className="h-4 w-4 mr-2" />
                  {t("orderService")}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 py-3 bg-transparent"
                asChild
              >
                <Link href={`/${locale}/contact`}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t("askQuestion")}
                </Link>
              </Button>
            </div>

            {/* Що входить у послугу */}
            {whatIncludedList.length > 0 && (
              <div className="pt-2">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{t("whatIncluded")}</h3>
                <div className="space-y-2">
                  {whatIncludedList.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Компактні повноширинні секції */}
        <div className="space-y-8">
          {/* FAQ Section */}
          {faqs.length > 0 && (
            <section className="bg-gray-50 rounded-xl p-6 lg:p-8">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6 text-center">{t("frequentQuestions")}</h2>
              <div className="space-y-4 max-w-4xl mx-auto">
                {processedFaqs.map((faq) => (
                  <Collapsible key={faq.id}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                      <span className="font-semibold text-gray-900 text-sm lg:text-base pr-4">
                        {faq.translation.question}
                      </span>
                      <ChevronDown className="h-5 w-5 text-gray-500 transition-transform ui-open:rotate-180 flex-shrink-0" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4 bg-white rounded-b-lg border-x border-b border-gray-200 -mt-1">
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-gray-600 leading-relaxed text-sm lg:text-base">{faq.translation.answer}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </section>
          )}

          {/* Final CTA */}
          <section className="bg-blue-600 rounded-xl p-6 lg:p-8 text-center text-white">
            <h2 className="text-xl lg:text-2xl font-bold mb-2">{t("haveQuestions")}</h2>
            <p className="text-blue-100 mb-4 lg:mb-6 max-w-xl mx-auto text-sm lg:text-base">{t("expertsReady")}</p>
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-blue-600 hover:bg-gray-50 border-white px-6 py-3"
              asChild
            >
              <Link href={`/${locale}/contact`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                {commonT("contactUs")}
              </Link>
            </Button>
          </section>

          <ContactCTABanner locale={locale} variant="compact" />
        </div>
      </div>
    </div>
  )
}
