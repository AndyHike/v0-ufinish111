"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Phone, Mail, MapPin, Clock, Shield, Users, ArrowRight, Star, TrendingUp, ArrowLeft } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import { formatImageUrl } from "@/utils/image-url"

interface ServicePageClientProps {
  service: any
  locale: string
  translations: {
    [key: string]: string
  }
}

export function ServicePageClient({ service, locale, translations }: ServicePageClientProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>("")
  const [filteredModels, setFilteredModels] = useState(service.models || [])

  // Отримуємо локалізований опис послуги
  const serviceDescription = service.services_translations?.[0] || {}
  const serviceName = serviceDescription.name || service.name || ""
  const serviceDesc = serviceDescription.description || service.description || ""

  // Отримуємо унікальні бренди
  const brands = Array.from(
    new Set(service.models?.map((model: any) => model.models?.brands?.name).filter(Boolean)),
  ).sort()

  // Фільтруємо моделі за брендом
  useEffect(() => {
    if (selectedBrand) {
      setFilteredModels(service.models?.filter((model: any) => model.models?.brands?.name === selectedBrand) || [])
    } else {
      setFilteredModels(service.models || [])
    }
  }, [selectedBrand, service.models])

  // Функція для відстеження кліків на послуги
  const trackServiceInteraction = (action: string, modelName?: string) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("trackCustom", "ServiceInteraction", {
        service_name: serviceName,
        action: action,
        model_name: modelName || "",
        page_url: window.location.href,
        timestamp: new Date().toISOString(),
      })
    }
  }

  const handleContactClick = (method: string) => {
    trackServiceInteraction("contact_click", method)
  }

  const handleModelClick = (modelName: string) => {
    trackServiceInteraction("model_click", modelName)
  }

  const handleRequestService = () => {
    trackServiceInteraction("request_service")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <Link
              href={`/${locale}/services`}
              className="mb-6 inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад до послуг
            </Link>

            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">{serviceName}</h1>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">{serviceDesc}</p>
            </div>

            {/* Service Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-lg md:text-2xl font-bold text-primary">
                    {formatCurrency(service.stats.minPrice)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">від</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-lg md:text-2xl font-bold text-primary">
                    {formatCurrency(service.stats.avgPrice)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">середня</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-lg md:text-2xl font-bold text-primary">{service.stats.modelsCount}</div>
                  <div className="text-xs md:text-sm text-gray-600">моделей</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-lg md:text-2xl font-bold text-primary">
                    <Clock className="h-5 w-5 md:h-6 md:w-6 mx-auto" />
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">30-60 хв</div>
                </CardContent>
              </Card>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <Button size="lg" className="w-full md:w-auto" onClick={handleRequestService} asChild>
                <Link href={`/${locale}/contact?service=${encodeURIComponent(serviceName)}`}>
                  Замовити послугу
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Why Choose Us */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="mr-2 h-5 w-5 text-primary" />
                    Чому обирають нас
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h3 className="font-semibold mb-1">Гарантія якості</h3>
                      <p className="text-sm text-gray-600">6 місяців гарантії</p>
                    </div>
                    <div className="text-center">
                      <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h3 className="font-semibold mb-1">Швидкий сервіс</h3>
                      <p className="text-sm text-gray-600">Швидкий ремонт</p>
                    </div>
                    <div className="text-center">
                      <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h3 className="font-semibold mb-1">Досвідчені техніки</h3>
                      <p className="text-sm text-gray-600">Професійні майстри</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supported Models */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                      Доступно для ({filteredModels.length} моделей)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Brand Filter */}
                  {brands.length > 1 && (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={selectedBrand === "" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedBrand("")}
                        >
                          Всі бренди
                        </Button>
                        {brands.map((brand) => (
                          <Button
                            key={brand}
                            variant={selectedBrand === brand ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedBrand(brand as string)}
                          >
                            {brand}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Models Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredModels.slice(0, 8).map((modelService: any) => {
                      const model = modelService.models
                      if (!model) return null

                      return (
                        <Link
                          key={model.id}
                          href={`/${locale}/models/${model.slug || model.id}`}
                          className="block group"
                          onClick={() => handleModelClick(model.name)}
                        >
                          <Card className="h-full hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <Image
                                    src={formatImageUrl(model.image_url) || "/placeholder.svg?height=40&width=40"}
                                    alt={model.name}
                                    width={40}
                                    height={40}
                                    className="rounded-lg object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 truncate">{model.name}</p>
                                      <p className="text-xs text-gray-500">{model.brands?.name}</p>
                                    </div>
                                    <Badge variant="secondary" className="ml-2">
                                      {formatCurrency(modelService.price)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      )
                    })}
                  </div>

                  {filteredModels.length > 8 && (
                    <div className="text-center mt-6">
                      <Button variant="outline">Переглянути всі моделі ({filteredModels.length - 8} більше)</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Потрібна допомога?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" onClick={() => handleContactClick("phone")} asChild>
                    <a href="tel:+420123456789">
                      <Phone className="mr-2 h-4 w-4" />
                      +420 123 456 789
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => handleContactClick("email")}
                    asChild
                  >
                    <a href="mailto:info@devicehelp.cz">
                      <Mail className="mr-2 h-4 w-4" />
                      info@devicehelp.cz
                    </a>
                  </Button>

                  <Separator />

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4" />
                      Praha, Česká republika
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Пн-Пт: 9:00-18:00
                    </div>
                  </div>

                  <Separator />

                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => handleContactClick("contact_form")}
                    asChild
                  >
                    <Link href={`/${locale}/contact?service=${encodeURIComponent(serviceName)}`}>
                      Написати повідомлення
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Service Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Інформація про послугу</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Час виконання:</span>
                    <span className="font-medium">30-60 хв</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Гарантія:</span>
                    <span className="font-medium">6 місяців</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Підтримуваних моделей:</span>
                    <span className="font-medium">{service.stats.modelsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ціна від:</span>
                    <span className="font-medium text-primary">{formatCurrency(service.stats.minPrice)}</span>
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
