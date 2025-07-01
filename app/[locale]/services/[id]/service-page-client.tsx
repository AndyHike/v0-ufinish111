"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Phone, DollarSign, Users, Wrench, ExternalLink } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import { formatImageUrl } from "@/utils/image-url"

interface ServiceData {
  id: string
  name: string
  description: string
  stats: {
    minPrice: number
    maxPrice: number
    avgPrice: number
    modelsCount: number
    brandsCount: number
  }
  supportedModels: Array<{
    id: string
    price: number | null
    model: {
      id: string
      name: string
      slug: string | null
      image_url: string | null
      brand: {
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
    }
  }>
}

interface Props {
  serviceData: ServiceData
  locale: string
}

export default function ServicePageClient({ serviceData, locale }: Props) {
  const t = useTranslations("Services")
  const commonT = useTranslations("Common")
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)

  // Group models by brand
  const modelsByBrand = serviceData.supportedModels.reduce(
    (acc, modelService) => {
      const brandName = modelService.model.brand.name
      if (!acc[brandName]) {
        acc[brandName] = {
          brand: modelService.model.brand,
          models: [],
        }
      }
      acc[brandName].models.push(modelService)
      return acc
    },
    {} as Record<string, { brand: any; models: any[] }>,
  )

  const brands = Object.keys(modelsByBrand)
  const filteredModels = selectedBrand ? modelsByBrand[selectedBrand]?.models || [] : serviceData.supportedModels

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Back button */}
        <Link
          href={`/${locale}`}
          className="mb-8 inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {commonT("backToHome")}
        </Link>

        {/* Service Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wrench className="h-8 w-8" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{serviceData.name}</h1>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">{serviceData.description}</p>
        </div>

        {/* Service Statistics */}
        <div className="mb-12 grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4" />
                {t("priceRange")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {serviceData.stats.minPrice > 0
                  ? `${formatCurrency(serviceData.stats.minPrice)} - ${formatCurrency(serviceData.stats.maxPrice)}`
                  : t("priceOnRequest")}
              </div>
              {serviceData.stats.avgPrice > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("avgPrice")}: {formatCurrency(serviceData.stats.avgPrice)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4" />
                {t("supportedModels")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceData.stats.modelsCount}</div>
              <p className="text-xs text-muted-foreground">{t("modelsAvailable")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                {t("supportedBrands")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceData.stats.brandsCount}</div>
              <p className="text-xs text-muted-foreground">{t("brandsAvailable")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Wrench className="h-4 w-4" />
                {t("serviceType")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-sm">
                {t("repairService")}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">{t("professionalService")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Brand Filter */}
        {brands.length > 1 && (
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold">{t("filterByBrand")}</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedBrand === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBrand(null)}
              >
                {t("allBrands")}
              </Button>
              {brands.map((brandName) => (
                <Button
                  key={brandName}
                  variant={selectedBrand === brandName ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBrand(brandName)}
                  className="flex items-center gap-2"
                >
                  {modelsByBrand[brandName].brand.logo_url && (
                    <img
                      src={formatImageUrl(modelsByBrand[brandName].brand.logo_url) || "/placeholder.svg"}
                      alt={brandName}
                      className="h-4 w-4 rounded-full object-contain"
                    />
                  )}
                  {brandName}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Supported Models */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">{t("supportedModels")}</h2>

          {filteredModels.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredModels.map((modelService) => (
                <Card key={modelService.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-50">
                        <img
                          src={
                            formatImageUrl(modelService.model.image_url) ||
                            "/placeholder.svg?height=48&width=48&query=phone" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                          alt={modelService.model.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {modelService.model.brand.logo_url && (
                            <img
                              src={formatImageUrl(modelService.model.brand.logo_url) || "/placeholder.svg"}
                              alt={modelService.model.brand.name}
                              className="h-4 w-4 rounded-full object-contain"
                            />
                          )}
                          <span className="text-xs text-muted-foreground">{modelService.model.brand.name}</span>
                        </div>
                        <h3 className="font-medium text-sm mb-2 truncate">{modelService.model.name}</h3>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-primary">
                            {modelService.price !== null ? formatCurrency(modelService.price) : t("priceOnRequest")}
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/${locale}/models/${modelService.model.slug || modelService.model.id}`}>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                            <Button size="sm" asChild>
                              <Link
                                href={`/${locale}/contact?service=${encodeURIComponent(serviceData.name)}&model=${encodeURIComponent(modelService.model.name)}`}
                              >
                                {commonT("order")}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("noModelsFound")}</p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="mb-4 text-xl font-bold">{t("needThisService")}</h3>
            <p className="mb-6 text-muted-foreground">{t("contactUsForService")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href={`/${locale}/contact?service=${encodeURIComponent(serviceData.name)}`}>
                  {commonT("contactUs")}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={`/${locale}`}>{commonT("browseServices")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
