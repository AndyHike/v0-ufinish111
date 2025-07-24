"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Clock, Shield, Calendar, Star } from "lucide-react"
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const images = [
    serviceData.image_url || "/placeholder.svg?height=400&width=600&text=Service+Image",
    "/placeholder.svg?height=400&width=600&text=Before+Repair",
    "/placeholder.svg?height=400&width=600&text=After+Repair",
  ]

  const formatPrice = (price: number | null) => {
    if (!price) return "Price on request"
    return formatCurrency(price, locale)
  }

  const getPriceDisplay = () => {
    if (serviceData.modelServicePrice !== null) {
      return formatPrice(serviceData.modelServicePrice)
    }

    if (serviceData.minPrice && serviceData.maxPrice) {
      if (serviceData.minPrice === serviceData.maxPrice) {
        return formatPrice(serviceData.minPrice)
      }
      return `${formatPrice(serviceData.minPrice)} - ${formatPrice(serviceData.maxPrice)}`
    }

    return "Price on request"
  }

  const getBookingUrl = () => {
    if (serviceData.sourceModel) {
      return `/${locale}/booking?service=${serviceData.slug}&model=${serviceData.sourceModel.slug}`
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href={`/${locale}/services`} className="hover:text-foreground">
            Services
          </Link>
          <span>/</span>
          <span className="text-foreground">{serviceData.translation.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            <div className="aspect-[4/3] relative overflow-hidden rounded-lg bg-muted">
              <Image
                src={images[selectedImageIndex] || "/placeholder.svg"}
                alt={serviceData.translation.name}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Thumbnail Images */}
            <div className="flex gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square w-20 relative overflow-hidden rounded-md border-2 ${
                    selectedImageIndex === index ? "border-primary" : "border-muted"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${serviceData.translation.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Service Details */}
          <div className="space-y-6">
            {/* Source Model Info */}
            {serviceData.sourceModel && (
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="relative w-12 h-12">
                  <Image
                    src={serviceData.sourceModel.brands.logo_url || "/placeholder.svg?height=48&width=48"}
                    alt={serviceData.sourceModel.brands.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service for</p>
                  <p className="font-medium">
                    {serviceData.sourceModel.brands.name} {serviceData.sourceModel.name}
                  </p>
                </div>
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold mb-2">{serviceData.translation.name}</h1>
              <p className="text-lg text-muted-foreground mb-4">{serviceData.translation.description}</p>

              {/* Price */}
              <div className="mb-6">
                <div className="text-3xl font-bold text-primary mb-2">{getPriceDisplay()}</div>
                {!serviceData.modelServicePrice && serviceData.minPrice && serviceData.maxPrice && (
                  <p className="text-sm text-muted-foreground">Price varies by device model</p>
                )}
              </div>

              {/* Service Features */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {serviceData.warranty_months && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{serviceData.warranty_months} months</p>
                      <p className="text-sm text-muted-foreground">Warranty</p>
                    </div>
                  </div>
                )}

                {serviceData.duration_hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{serviceData.duration_hours}h</p>
                      <p className="text-sm text-muted-foreground">Duration</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {getBookingUrl() && (
                  <Button asChild size="lg" className="w-full">
                    <Link href={getBookingUrl()!} className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Book Service
                    </Link>
                  </Button>
                )}

                <Button variant="outline" size="lg" className="w-full bg-transparent">
                  <Link href={`/${locale}/contact`} className="flex items-center gap-2">
                    Get Quote
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Service Details Tabs */}
        <div className="mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Detailed Description */}
              {serviceData.translation.detailed_description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Service Details</CardTitle>
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
                    <CardTitle>What's Included</CardTitle>
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
                    <CardTitle>Frequently Asked Questions</CardTitle>
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
              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-medium">{getPriceDisplay()}</span>
                  </div>

                  {serviceData.warranty_months && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Warranty:</span>
                      <span className="font-medium">{serviceData.warranty_months} months</span>
                    </div>
                  )}

                  {serviceData.duration_hours && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{serviceData.duration_hours} hours</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trust Indicators */}
              <Card>
                <CardHeader>
                  <CardTitle>Why Choose Us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Professional technicians</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Quality guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Fast turnaround</span>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Have questions about this service? Contact us for more information.
                  </p>
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href={`/${locale}/contact`}>Contact Us</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
