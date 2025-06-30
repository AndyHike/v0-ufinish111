"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Phone, Clock, Shield, Star, CheckCircle } from "lucide-react"
import { Smartphone, Battery, Wifi, Droplet, Brush, Wrench } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import { formatImageUrl } from "@/utils/image-url"

interface ServicePageClientProps {
  service: any
  locale: string
  translations: {
    [key: string]: string
  }
}

// Icon mapping
const iconMap = {
  smartphone: Smartphone,
  battery: Battery,
  wifi: Wifi,
  droplet: Droplet,
  brush: Brush,
  wrench: Wrench,
}

export function ServicePageClient({ service, locale, translations }: ServicePageClientProps) {
  const [isLoading, setIsLoading] = useState(false)

  const serviceName = service.services_translations[0]?.name || service.name || ""
  const serviceDescription = service.services_translations[0]?.description || service.description || ""
  const IconComponent = iconMap[service.icon as keyof typeof iconMap] || Wrench

  const handleContactClick = () => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("trackCustom", "ServiceContactClick", {
        service_name: serviceName,
        service_id: service.id,
        timestamp: new Date().toISOString(),
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container px-4 py-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          {/* Back button */}
          <Link
            href={`/${locale}/services`}
            className="mb-6 inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm hover:text-primary hover:shadow-md transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            {translations.backToServices || "Назад до послуг"}
          </Link>

          {/* Hero Section */}
          <div className="mb-8 md:mb-12">
            <Card className="border-0 bg-white shadow-lg">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 md:h-20 md:w-20">
                    <IconComponent className="h-8 w-8 text-primary md:h-10 md:w-10" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight md:text-4xl lg:text-5xl">{serviceName}</h1>
                    <p className="mt-3 text-base text-muted-foreground md:text-lg lg:text-xl">{serviceDescription}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {translations.warranty || "Гарантія"}
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {translations.fastService || "Швидко"}
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" />
                        {translations.professional || "Професійно"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <Button size="lg" asChild className="w-full md:w-auto" onClick={handleContactClick}>
                      <Link href={`/${locale}/contact?service=${encodeURIComponent(serviceName)}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        {translations.contact || "Зв'язатися"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Details */}
          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card className="mb-6 border-0 bg-white shadow-lg md:mb-8">
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl">
                    {translations.serviceDetails || "Деталі послуги"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">{translations.qualityParts || "Якісні деталі"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {translations.qualityPartsDesc || "Використовуємо тільки оригінальні та сертифіковані деталі"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">{translations.fastRepair || "Швидкий ремонт"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {translations.fastRepairDesc || "Більшість ремонтів виконуємо протягом 1-2 годин"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">{translations.warranty || "Гарантія"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {translations.warrantyDesc || "Надаємо гарантію на всі види ремонту"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">{translations.experience || "Досвід"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {translations.experienceDesc || "Багаторічний досвід роботи з різними моделями"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Models */}
              {service.models && service.models.length > 0 && (
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl md:text-2xl">
                      {translations.availableForModels || "Доступно для моделей"}
                    </CardTitle>
                    <CardDescription>
                      {translations.availableForModelsDesc || "Ця послуга доступна для наступних моделей пристроїв"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {service.models.slice(0, 6).map((modelService: any) => (
                        <Link
                          key={modelService.models.id}
                          href={`/${locale}/models/${modelService.models.slug || modelService.models.id}`}
                          className="group rounded-lg border p-4 transition-all hover:border-primary hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                              <img
                                src={
                                  formatImageUrl(modelService.models.image_url) ||
                                  "/placeholder.svg?height=48&width=48&query=phone"
                                }
                                alt={modelService.models.name}
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                {modelService.models.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {modelService.models.brands?.name}
                              </p>
                              {modelService.price && (
                                <p className="text-sm font-medium text-primary">
                                  від {formatCurrency(modelService.price)}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">{translations.needHelp || "Потрібна допомога?"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {translations.contactDescription ||
                      "Зв'яжіться з нами для отримання консультації або запису на ремонт"}
                  </p>
                  <Button className="w-full" asChild onClick={handleContactClick}>
                    <Link href={`/${locale}/contact?service=${encodeURIComponent(serviceName)}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      {translations.contact || "Зв'язатися"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Process Card */}
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">{translations.repairProcess || "Процес ремонту"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-medium">{translations.step1 || "Діагностика"}</p>
                        <p className="text-xs text-muted-foreground">
                          {translations.step1Desc || "Безкоштовна діагностика пристрою"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-medium">{translations.step2 || "Узгодження"}</p>
                        <p className="text-xs text-muted-foreground">
                          {translations.step2Desc || "Узгодження вартості та термінів"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-medium">{translations.step3 || "Ремонт"}</p>
                        <p className="text-xs text-muted-foreground">
                          {translations.step3Desc || "Професійний ремонт пристрою"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        4
                      </div>
                      <div>
                        <p className="text-sm font-medium">{translations.step4 || "Тестування"}</p>
                        <p className="text-xs text-muted-foreground">
                          {translations.step4Desc || "Перевірка якості ремонту"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
