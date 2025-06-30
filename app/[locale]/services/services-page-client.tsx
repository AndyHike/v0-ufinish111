"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Battery, Wifi, Shield, Droplet, Brush, Wrench } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

interface ServicesPageClientProps {
  locale: string
  translations: {
    [key: string]: string
  }
}

interface Service {
  id: string
  slug?: string
  name: string
  description: string
  icon: string
  stats?: {
    minPrice: number
    modelsCount: number
  }
}

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

export function ServicesPageClient({ locale, translations }: ServicesPageClientProps) {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`/api/services?locale=${locale}`)
        if (response.ok) {
          const data = await response.json()
          setServices(data)
        }
      } catch (error) {
        console.error("Error fetching services:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchServices()
  }, [locale])

  const handleServiceClick = (serviceName: string) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("trackCustom", "ServiceClick", {
        service_name: serviceName,
        source: "services_page",
        timestamp: new Date().toISOString(),
      })
    }
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            {translations.title || "Наші послуги"}
          </h1>
          <p className="mt-4 text-muted-foreground md:text-xl">
            {translations.subtitle || "Професійний ремонт мобільних пристроїв"}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader>
                    <div className="h-8 w-8 rounded-full bg-gray-200 mb-2"></div>
                    <div className="h-6 w-2/3 bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = iconMap[service.icon as keyof typeof iconMap] || Wrench
              const serviceUrl = service.slug
                ? `/${locale}/services/${service.slug}`
                : `/${locale}/services/${service.id}`

              return (
                <Link
                  key={service.id}
                  href={serviceUrl}
                  className="group"
                  onClick={() => handleServiceClick(service.name)}
                >
                  <Card className="h-full transition-all duration-200 hover:shadow-lg group-hover:border-primary">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {service.name}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">{service.description}</CardDescription>

                      {service.stats && (
                        <div className="flex gap-2">
                          {service.stats.minPrice > 0 && (
                            <Badge variant="secondary">
                              {translations.from || "від"} {formatCurrency(service.stats.minPrice)}
                            </Badge>
                          )}
                          {service.stats.modelsCount > 0 && (
                            <Badge variant="outline">
                              {service.stats.modelsCount} {translations.modelsSupported || "моделей"}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="mt-4">
                        <span className="text-sm text-primary font-medium group-hover:underline">
                          {translations.learnMore || "Дізнатися більше"} →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
