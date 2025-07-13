"use client"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, MessageCircle, Clock, Shield, Star } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import { formatImageUrl } from "@/utils/image-url"

interface ModelData {
  id: string
  name: string
  slug: string
  image_url: string | null
  brands: {
    id: string
    name: string
    slug: string | null
    logo_url: string | null
  }
  series: {
    id: string
    name: string
    slug: string | null
  } | null
  services: Array<{
    id: string
    slug: string
    name: string
    description: string
    price: number | null
    warranty_months: number | null
    duration_hours: number | null
    warranty_period: string
    position: number
    image_url: string | null
  }>
}

interface Props {
  modelData: ModelData
  locale: string
}

export default function ModelPageClient({ modelData, locale }: Props) {
  const t = useTranslations("Models")
  const servicesT = useTranslations("Services")
  const commonT = useTranslations("Common")

  // Виправлена логіка форматування гарантії
  const formatWarranty = (months: number | null, period: string) => {
    // Правильна перевірка: перевіряємо на null/undefined, а не на falsy значення
    if (months === null || months === undefined) return servicesT("contactForWarranty")

    // Якщо months = 0, то показуємо "0 місяців" або "0 днів"
    return period === "days"
      ? servicesT("warrantyDays", { count: months })
      : servicesT("warrantyMonths", { count: months })
  }

  // Виправлена логіка форматування тривалості
  const formatDuration = (hours: number | null) => {
    // Правильна перевірка: перевіряємо на null/undefined, а не на falsy значення
    if (hours === null || hours === undefined) return servicesT("contactForTime")

    // Якщо hours = 0, то показуємо "від 0 годин"
    return servicesT("fromHours", { hours })
  }

  // Виправлена логіка відображення ціни
  const formatPrice = (price: number | null) => {
    // Правильна перевірка: перевіряємо на null/undefined, а не на falsy
    if (price === null || price === undefined) {
      return servicesT("priceOnRequest")
    }
    // Якщо ціна є (навіть 0) - показуємо її
    return formatCurrency(price)
  }

  console.log("[MODEL CLIENT] Model data:", {
    modelName: modelData.name,
    servicesCount: modelData.services.length,
    firstService: modelData.services[0]
      ? {
          name: modelData.services[0].name,
          price: modelData.services[0].price,
          warranty_months: modelData.services[0].warranty_months,
          duration_hours: modelData.services[0].duration_hours,
          warranty_period: modelData.services[0].warranty_period,
        }
      : null,
  })

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Link href={`/${locale}`} className="hover:text-blue-600 transition-colors">
              {commonT("home")}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/brands`} className="hover:text-blue-600 transition-colors">
              {t("brands")}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/brands/${modelData.brands.slug}`} className="hover:text-blue-600 transition-colors">
              {modelData.brands.name}
            </Link>
            {modelData.series && (
              <>
                <span>/</span>
                <Link
                  href={`/${locale}/series/${modelData.series.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {modelData.series.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-900 font-medium">{modelData.name}</span>
          </div>
        </nav>

        {/* Model Header */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Model Image */}
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden">
            {modelData.image_url ? (
              <img
                src={formatImageUrl(modelData.image_url) || "/placeholder.svg"}
                alt={`${modelData.brands.name} ${modelData.name}`}
                className="w-full h-full object-contain bg-white"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700">
                    {modelData.brands.name} {modelData.name}
                  </h3>
                </div>
              </div>
            )}
          </div>

          {/* Model Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {modelData.brands.logo_url && (
                  <img
                    src={formatImageUrl(modelData.brands.logo_url) || "/placeholder.svg"}
                    alt={modelData.brands.name}
                    className="w-8 h-8 object-contain"
                  />
                )}
                <Badge variant="secondary" className="text-sm">
                  {modelData.brands.name}
                </Badge>
                {modelData.series && (
                  <Badge variant="outline" className="text-sm">
                    {modelData.series.name}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {modelData.brands.name} {modelData.name}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t("modelDescription", { brand: modelData.brands.name, model: modelData.name })}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{modelData.services.length}</div>
                <div className="text-sm text-blue-800">{t("availableServices")}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-1 text-green-600">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="text-2xl font-bold">4.9</span>
                </div>
                <div className="text-sm text-green-800">{t("customerRating")}</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href={`/${locale}/contact?model=${encodeURIComponent(modelData.name)}`}>
                  <Phone className="h-5 w-5 mr-2" />
                  {commonT("contactUs")}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={`/${locale}/contact`}>
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {t("askQuestion")}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{t("availableServices")}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t("servicesDescription", { model: modelData.name })}</p>
          </div>

          {modelData.services.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {modelData.services.map((service) => (
                <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Service Image */}
                      <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
                        {service.image_url ? (
                          <img
                            src={formatImageUrl(service.image_url) || "/placeholder.svg"}
                            alt={service.name}
                            className="w-full h-full object-contain bg-white"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <div className="w-6 h-6 bg-blue-600 rounded"></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Service Info */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{service.description}</p>

                        {/* Price */}
                        <div className="text-xl font-bold text-gray-900">{formatPrice(service.price)}</div>

                        {/* Service Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-600">{formatDuration(service.duration_hours)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="text-gray-600">
                              {formatWarranty(service.warranty_months, service.warranty_period)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
                            <Link href={`/${locale}/services/${service.slug}?model=${modelData.slug}`}>
                              {servicesT("viewDetails")}
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              href={`/${locale}/contact?service=${encodeURIComponent(service.name)}&model=${encodeURIComponent(modelData.name)}`}
                            >
                              {servicesT("order")}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-gray-400 rounded-lg"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("noServicesAvailable")}</h3>
              <p className="text-gray-600 mb-6">{t("servicesInDevelopment")}</p>
              <Button asChild>
                <Link href={`/${locale}/contact?model=${encodeURIComponent(modelData.name)}`}>
                  {commonT("contactUs")}
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">{t("needHelp")}</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">{t("expertHelp", { model: modelData.name })}</p>
          <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-50" asChild>
            <Link href={`/${locale}/contact?model=${encodeURIComponent(modelData.name)}`}>
              <Phone className="h-5 w-5 mr-2" />
              {commonT("contactUs")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
