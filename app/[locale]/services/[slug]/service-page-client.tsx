"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Shield, Star, Phone, Wrench, Smartphone, Battery, Wifi, Droplet, Brush } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import { formatImageUrl } from "@/utils/image-url"

interface ServiceData {
  id: string
  slug: string
  icon: string
  name: string
  description: string
  stats: {
    minPrice: number
    maxPrice: number
    avgPrice: number
    modelsCount: number
    brandsCount: number
  }
  relatedModels: Array<{
    id: string
    price: number
    model: {
      id: string
      name: string
      slug: string
      image_url: string
      brand: {
        id: string
        name: string
        slug: string
        logo_url: string
      }
    }
  }>
}

interface ServicePageClientProps {
  slug: string
  locale: string
}

export function ServicePageClient({ slug, locale }: ServicePageClientProps) {
  const [service, setService] = useState<ServiceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations("Services")
  const commonT = useTranslations("Common")

  // Icon mapping
  const iconMap = {
    smartphone: Smartphone,
    battery: Battery,
    wifi: Wifi,
    shield: Shield,
    droplet: Droplet,
    brush: Brush,
    wrench: Wrench,
  }

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/services/${slug}?locale=${locale}`)
        if (!response.ok) {
          throw new Error("Service not found")
        }
        const data = await response.json()
        setService(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load service")
      } finally {
        setIsLoading(false)
      }
    }

    fetchService()
  }, [slug, locale])

  if (isLoading) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-8"></div>
            <div className="h-12 w-96 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 w-full max-w-2xl bg-gray-200 rounded mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <p className="text-muted-foreground mb-8">The requested service could not be found.</p>
          <Button asChild>
            <Link href={`/${locale}/services`}>Back to Services</Link>
          </Button>
        </div>
      </div>
    )
  }

  const Icon = iconMap[service.icon as keyof typeof iconMap] || Wrench

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Back button */}
        <Link
          href={`/${locale}/services`}
          className="mb-8 inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {commonT("backToServices") || "Back to Services"}
        </Link>

        {/* Service Header */}
        <div className="mb-12 flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{service.name}</h1>
            <p className="mt-2 max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {service.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">
                {service.stats.modelsCount} {commonT("models") || "models"}
              </Badge>
              <Badge variant="secondary">
                {service.stats.brandsCount} {commonT("brands") || "brands"}
              </Badge>
              {service.stats.minPrice > 0 && (
                <Badge variant="outline">
                  {commonT("from") || "From"} {formatCurrency(service.stats.minPrice)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Service Features */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                {commonT("fastService") || "Fast Service"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {commonT("fastServiceDesc") || "Quick turnaround time for most repairs"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                {commonT("warranty") || "Warranty"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {commonT("warrantyDesc") || "All repairs come with warranty coverage"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-primary" />
                {commonT("quality") || "Quality"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {commonT("qualityDesc") || "Professional repair with original parts"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Information */}
        {service.stats.minPrice > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-bold">{commonT("pricing") || "Pricing"}</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{formatCurrency(service.stats.minPrice)}</div>
                    <div className="text-sm text-muted-foreground">{commonT("startingFrom") || "Starting from"}</div>
                  </div>
                  {service.stats.avgPrice > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatCurrency(service.stats.avgPrice)}</div>
                      <div className="text-sm text-muted-foreground">{commonT("averagePrice") || "Average price"}</div>
                    </div>
                  )}
                  {service.stats.maxPrice > service.stats.minPrice && (
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatCurrency(service.stats.maxPrice)}</div>
                      <div className="text-sm text-muted-foreground">{commonT("upTo") || "Up to"}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Supported Models */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">{commonT("supportedModels") || "Supported Models"}</h2>
          {service.relatedModels.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {service.relatedModels.slice(0, 12).map((modelService) => (
                <Card key={modelService.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={
                            formatImageUrl(modelService.model.image_url) ||
                            "/placeholder.svg?height=48&width=48&query=phone"
                          }
                          alt={modelService.model.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          {modelService.model.brand.logo_url && (
                            <img
                              src={formatImageUrl(modelService.model.brand.logo_url) || "/placeholder.svg"}
                              alt={modelService.model.brand.name}
                              className="h-4 w-4 object-contain"
                            />
                          )}
                          <span className="text-xs text-muted-foreground">{modelService.model.brand.name}</span>
                        </div>
                        <h3 className="font-medium text-sm truncate">{modelService.model.name}</h3>
                        {modelService.price && (
                          <p className="text-sm font-semibold text-primary">{formatCurrency(modelService.price)}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" asChild className="flex-1 bg-transparent">
                        <Link href={`/${locale}/models/${modelService.model.slug || modelService.model.id}`}>
                          {commonT("viewModel") || "View"}
                        </Link>
                      </Button>
                      <Button size="sm" asChild className="flex-1">
                        <Link
                          href={`/${locale}/contact?service=${encodeURIComponent(service.name)}&model=${encodeURIComponent(modelService.model.name)}`}
                        >
                          {commonT("order") || "Order"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              {commonT("noModelsAvailable") || "No models available for this service."}
            </p>
          )}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-2">{commonT("needHelp") || "Need Help?"}</h3>
              <p className="text-muted-foreground mb-4">
                {commonT("contactUsDesc") || "Contact us for a free consultation and quote"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg">
                  <Link href={`/${locale}/contact?service=${encodeURIComponent(service.name)}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    {commonT("contactUs") || "Contact Us"}
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href={`/${locale}/services`}>{commonT("viewAllServices") || "View All Services"}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
