"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Clock, Shield, ArrowLeft, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

type ServiceData = {
  id: string
  position: number
  warranty_months: number | null
  duration_hours: number | null
  image_url: string | null
  slug: string
  translation: {
    name: string
    description: string
    detailed_description: string | null
    what_included: string | null
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
    slug: string
    image_url: string | null
    brands: {
      id: string
      name: string
      slug: string
      logo_url: string | null
    }
  } | null
  modelServicePrice: number | null
  minPrice: number | null
  maxPrice: number | null
}

type Props = {
  serviceData: ServiceData
  locale: string
}

export default function ServicePageClient({ serviceData, locale }: Props) {
  const t = useTranslations("ServicePage")
  const [imageError, setImageError] = useState(false)

  const formatPrice = (price: number | null) => {
    if (!price) return t("priceOnRequest")
    return formatCurrency(price, locale)
  }

  const getPriceDisplay = () => {
    if (serviceData.modelServicePrice) {
      return formatPrice(serviceData.modelServicePrice)
    }

    if (serviceData.minPrice && serviceData.maxPrice) {
      if (serviceData.minPrice === serviceData.maxPrice) {
        return formatPrice(serviceData.minPrice)
      }
      return `${formatPrice(serviceData.minPrice)} - ${formatPrice(serviceData.maxPrice)}`
    }

    return t("priceOnRequest")
  }

  const getBookingUrl = () => {
    if (serviceData.sourceModel) {
      const params = new URLSearchParams({
        service: serviceData.slug,
        brand: serviceData.sourceModel.brands.slug,
        model: serviceData.sourceModel.slug,
      })
      return `/${locale}/book-service?${params.toString()}`
    }
    return `/${locale}/contact`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      {serviceData.sourceModel && (
        <Link
          href={`/${locale}/models/${serviceData.sourceModel.slug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToModel", { model: serviceData.sourceModel.name })}
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Header */}
          <div>
            <h1 className="text-3xl font-bold mb-4">{serviceData.translation.name}</h1>
            <p className="text-lg text-muted-foreground mb-6">{serviceData.translation.description}</p>

            {/* Service Image */}
            {serviceData.image_url && !imageError && (
              <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
                <Image
                  src={serviceData.image_url || "/placeholder.svg"}
                  alt={serviceData.translation.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            )}
          </div>

          {/* Source Model Info */}
          {serviceData.sourceModel && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("forDevice")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  {serviceData.sourceModel.brands.logo_url && (
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={serviceData.sourceModel.brands.logo_url || "/placeholder.svg"}
                        alt={serviceData.sourceModel.brands.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {serviceData.sourceModel.brands.name} {serviceData.sourceModel.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t("specificPricing")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Description */}
          {serviceData.translation.detailed_description && (
            <Card>
              <CardHeader>
                <CardTitle>{t("serviceDetails")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: serviceData.translation.detailed_description,
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* What's Included */}
          {serviceData.translation.what_included && (
            <Card>
              <CardHeader>
                <CardTitle>{t("whatsIncluded")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: serviceData.translation.what_included,
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* FAQs */}
          {serviceData.faqs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("faq")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {serviceData.faqs.map((faq, index) => (
                    <AccordionItem key={faq.id} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.translation.question}</AccordionTrigger>
                      <AccordionContent>
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: faq.translation.answer,
                          }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("pricing")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold text-primary">{getPriceDisplay()}</div>

              {/* Service Features */}
              <div className="space-y-3">
                {serviceData.warranty_months && (
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{t("warranty", { months: serviceData.warranty_months })}</span>
                  </div>
                )}

                {serviceData.duration_hours && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">{t("duration", { hours: serviceData.duration_hours })}</span>
                  </div>
                )}
              </div>

              {/* Book Service Button */}
              <Button asChild className="w-full" size="lg">
                <Link href={getBookingUrl()}>
                  <Calendar className="h-4 w-4 mr-2" />
                  {t("bookService")}
                </Link>
              </Button>

              {!serviceData.sourceModel && (
                <p className="text-xs text-muted-foreground text-center">{t("contactForBooking")}</p>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("additionalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{t("professionalService")}</p>
              <p>{t("qualityParts")}</p>
              <p>{t("fastTurnaround")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
