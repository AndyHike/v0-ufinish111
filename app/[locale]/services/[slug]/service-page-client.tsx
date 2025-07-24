"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, PhoneIcon, MailIcon, MapPinIcon } from "lucide-react"
import { toast } from "sonner"

interface Service {
  id: string
  name: string
  description: string
  price: number | null
  brand: string
  model: string
  series?: string
  faqs?: Array<{
    id: string
    question: string
    answer: string
  }>
}

export default function ServicePageClient() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/services/${params.slug}`)
        if (response.ok) {
          const data = await response.json()
          setService(data)
        } else {
          toast.error("Service not found")
        }
      } catch (error) {
        console.error("Error fetching service:", error)
        toast.error("Error loading service")
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchService()
    }
  }, [params.slug])

  const handleBookService = () => {
    if (!service) return

    const bookingParams = new URLSearchParams({
      brand: service.brand,
      model: service.model,
      service: service.name,
      serviceId: service.id,
    })

    if (service.series) {
      bookingParams.set("series", service.series)
    }

    if (service.price) {
      bookingParams.set("price", service.price.toString())
    }

    router.push(`/${params.locale}/book-service?${bookingParams.toString()}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t("Common.serviceNotFound")}</h1>
          <Button onClick={() => router.back()}>{t("Common.goBack")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Service Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">{service.brand}</Badge>
            <Badge variant="secondary">{service.model}</Badge>
            {service.series && <Badge variant="secondary">{service.series}</Badge>}
          </div>
          {service.price && <p className="text-2xl font-bold text-blue-600">{service.price} Kč</p>}
        </div>

        {/* Service Description */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Services.description")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{service.description}</p>
          </CardContent>
        </Card>

        {/* Book Service Button */}
        <div className="text-center">
          <Button size="lg" onClick={handleBookService} className="px-8 py-3 text-lg">
            <CalendarIcon className="mr-2 h-5 w-5" />
            {t("Services.bookService")}
          </Button>
        </div>

        {/* FAQs */}
        {service.faqs && service.faqs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("Services.faq")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {service.faqs.map((faq, index) => (
                  <AccordionItem key={faq.id} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Contact.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{t("Contact.phone")}</p>
                  <p className="text-gray-600">+420 123 456 789</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MailIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{t("Contact.email")}</p>
                  <p className="text-gray-600">info@devicehelp.cz</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPinIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{t("Contact.address")}</p>
                  <p className="text-gray-600">Praha 6-Břevnov</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
