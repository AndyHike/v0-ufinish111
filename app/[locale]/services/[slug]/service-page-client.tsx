"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Clock, Shield, ArrowLeft, Phone, MessageCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"

interface ServiceData {
  id: number
  position: number
  warranty_months: number | null
  duration_hours: number | null
  image_url: string | null
  slug: string
  translation: {
    name: string
    description: string | null
    detailed_description: string | null
    what_included: string | null
  }
  faqs: Array<{
    id: number
    position: number
    translation: {
      question: string
      answer: string
    }
  }>
  sourceModel: {
    id: number
    name: string
    slug: string
    image_url: string | null
    brands: {
      id: number
      name: string
      slug: string
      logo_url: string | null
    }
  } | null
  modelServicePrice: number | null
  minPrice: number | null
  maxPrice: number | null
}

interface ServicePageClientProps {
  serviceData: ServiceData
  locale: string
}

export default function ServicePageClient({ serviceData, locale }: ServicePageClientProps) {
  const t = useTranslations()
  const searchParams = useSearchParams()

  // ВИПРАВЛЕНО: Читаємо параметр model з URL напряму
  const modelParam = searchParams.get("model")

  const [isLoading, setIsLoading] = useState(false)

  // ВИПРАВЛЕНО: Логіка відображення ціни на основі URL параметра
  const shouldShowModelPrice = modelParam && serviceData.modelServicePrice !== null
  const shouldShowPriceRange = !modelParam && serviceData.minPrice !== null && serviceData.maxPrice !== null

  console.log("ServicePageClient render:", {
    modelParam,
    hasSourceModel: !!serviceData.sourceModel,
    modelServicePrice: serviceData.modelServicePrice,
    shouldShowModelPrice,
    shouldShowPriceRange,
    minPrice: serviceData.minPrice,
    maxPrice: serviceData.maxPrice,
  })

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return null
    return `${price.toLocaleString()} Kč`
  }

  const formatWarranty = (months: number | null) => {
    if (months === null || months === undefined) return null
    if (months === 0) return t("services.noWarranty")
    if (months === 1) return t("services.oneMonth")
    if (months < 5) return t("services.fewMonths", { count: months })
    return t("services.manyMonths", { count: months })
  }

  const formatDuration = (hours: number | null) => {
    if (hours === null || hours === undefined) return null
    if (hours === 0) return t("services.instantService")
    if (hours === 1) return t("services.oneHour")
    if (hours < 5) return t("services.fewHours", { count: hours })
    return t("services.manyHours", { count: hours })
  }

  const handleContactClick = () => {
    setIsLoading(true)
    // Simulate contact action
    setTimeout(() => setIsLoading(false), 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href={`/${locale}`} className="hover:text-primary transition-colors">
              {t("navigation.home")}
            </Link>
            <span>/</span>
            {serviceData.sourceModel && (
              <>
                <Link
                  href={`/${locale}/brands/${serviceData.sourceModel.brands.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {serviceData.sourceModel.brands.name}
                </Link>
                <span>/</span>
                <Link
                  href={`/${locale}/models/${serviceData.sourceModel.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {serviceData.sourceModel.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-foreground font-medium">{serviceData.translation.name}</span>
          </nav>
        </div>

        {/* Back Button */}
        {serviceData.sourceModel && (
          <div className="mb-6">
            <Link
              href={`/${locale}/models/${serviceData.sourceModel.slug}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common.backTo", { item: serviceData.sourceModel.name })}
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Header */}
            <Card className="overflow-hidden">
              <div className="relative">
                {serviceData.image_url && (
                  <div className="aspect-video relative">
                    <Image
                      src={serviceData.image_url || "/placeholder.svg"}
                      alt={serviceData.translation.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader
                  className={
                    serviceData.image_url
                      ? "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white"
                      : ""
                  }
                >
                  <CardTitle className="text-2xl lg:text-3xl">{serviceData.translation.name}</CardTitle>
                  {serviceData.translation.description && (
                    <CardDescription className={serviceData.image_url ? "text-gray-200" : ""}>
                      {serviceData.translation.description}
                    </CardDescription>
                  )}
                </CardHeader>
              </div>
            </Card>

            {/* Service Details */}
            {serviceData.translation.detailed_description && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("services.serviceDetails")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: serviceData.translation.detailed_description }}
                  />
                </CardContent>
              </Card>
            )}

            {/* What's Included */}
            {serviceData.translation.what_included && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("services.whatIncluded")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: serviceData.translation.what_included }}
                  />
                </CardContent>
              </Card>
            )}

            {/* FAQs */}
            {serviceData.faqs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("services.frequentlyAsked")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {serviceData.faqs.map((faq, index) => (
                      <AccordionItem key={faq.id} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">{faq.translation.question}</AccordionTrigger>
                        <AccordionContent>
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: faq.translation.answer }}
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
            {/* Source Model Info */}
            {serviceData.sourceModel && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("services.forDevice")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    {serviceData.sourceModel.brands.logo_url && (
                      <Image
                        src={serviceData.sourceModel.brands.logo_url || "/placeholder.svg"}
                        alt={serviceData.sourceModel.brands.name}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    )}
                    <div>
                      <p className="font-medium">{serviceData.sourceModel.brands.name}</p>
                      <p className="text-sm text-muted-foreground">{serviceData.sourceModel.name}</p>
                    </div>
                  </div>
                  {serviceData.sourceModel.image_url && (
                    <div className="aspect-square relative rounded-lg overflow-hidden">
                      <Image
                        src={serviceData.sourceModel.image_url || "/placeholder.svg"}
                        alt={serviceData.sourceModel.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("services.pricing")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shouldShowModelPrice ? (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{formatPrice(serviceData.modelServicePrice)}</div>
                    <p className="text-sm text-muted-foreground mt-1">{t("services.specificPrice")}</p>
                  </div>
                ) : shouldShowPriceRange ? (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {serviceData.minPrice === serviceData.maxPrice
                        ? formatPrice(serviceData.minPrice)
                        : `${formatPrice(serviceData.minPrice)} - ${formatPrice(serviceData.maxPrice)}`}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{t("services.priceRange")}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-muted-foreground">{t("services.contactForPrice")}</p>
                  </div>
                )}

                <Separator />

                {/* Service Info */}
                <div className="space-y-3">
                  {formatWarranty(serviceData.warranty_months) && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{formatWarranty(serviceData.warranty_months)}</span>
                    </div>
                  )}
                  {formatDuration(serviceData.duration_hours) && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{formatDuration(serviceData.duration_hours)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Contact Buttons */}
                <div className="space-y-2">
                  <Button className="w-full" onClick={handleContactClick} disabled={isLoading}>
                    <Phone className="h-4 w-4 mr-2" />
                    {isLoading ? t("common.loading") : t("services.callNow")}
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t("services.writeMessage")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
