"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Smartphone, Battery, Wifi, Shield, Droplet, Brush } from "lucide-react"
import { useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useParams } from "next/navigation"

interface Service {
  id: string
  slug?: string
  name: string
  description: string
  icon: string
}

export function ServicesSection() {
  const t = useTranslations("Services")
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const params = useParams()
  const locale = params?.locale || "uk"

  // Icon mapping
  const iconMap = {
    smartphone: Smartphone,
    battery: Battery,
    wifi: Wifi,
    shield: Shield,
    droplet: Droplet,
    brush: Brush,
  }

  // Fallback services for loading state
  const fallbackServices = [
    {
      id: "1",
      icon: "smartphone",
      titleKey: "service1.title",
      descriptionKey: "service1.description",
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: "2",
      icon: "battery",
      titleKey: "service2.title",
      descriptionKey: "service2.description",
      color: "bg-green-50 text-green-600",
    },
    {
      id: "3",
      icon: "wifi",
      titleKey: "service3.title",
      descriptionKey: "service3.description",
      color: "bg-purple-50 text-purple-600",
    },
    {
      id: "4",
      icon: "shield",
      titleKey: "service4.title",
      descriptionKey: "service4.description",
      color: "bg-amber-50 text-amber-600",
    },
    {
      id: "5",
      icon: "brush",
      titleKey: "phoneCleaning.title",
      descriptionKey: "phoneCleaning.description",
      color: "bg-teal-50 text-teal-600",
    },
    {
      id: "6",
      icon: "droplet",
      titleKey: "waterDamage.title",
      descriptionKey: "waterDamage.description",
      color: "bg-cyan-50 text-cyan-600",
    },
  ]

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

  const displayServices = isLoading ? fallbackServices : services

  return (
    <section className="py-6 md:py-12" id="services">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-1 text-center mb-4 md:mb-8">
          <h2 className="text-xl font-bold tracking-tighter sm:text-3xl">{t("title")}</h2>
          <p className="max-w-[700px] text-muted-foreground text-xs md:text-base">{t("subtitle")}</p>
        </div>

        {isMobile ? (
          // Mobile layout - compact grid
          <div className="grid grid-cols-2 gap-2">
            {(isLoading ? fallbackServices.slice(0, 4) : services.slice(0, 4)).map((service, index) => {
              if (isLoading) {
                return (
                  <div key={index} className="flex-shrink-0 bg-white rounded-lg p-3 shadow-sm h-[100px] animate-pulse">
                    <div className="h-6 w-6 rounded-full bg-gray-200 mb-2"></div>
                    <div className="h-3 w-2/3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-2 w-full bg-gray-200 rounded"></div>
                  </div>
                )
              }

              const Icon = iconMap[service.icon as keyof typeof iconMap] || Smartphone
              const serviceUrl = service.slug
                ? `/${locale}/services/${service.slug}`
                : `/${locale}/services/${service.id}`

              return (
                <Link
                  href={serviceUrl}
                  key={service.id}
                  className="bg-white rounded-lg p-3 shadow-sm hover:shadow transition-all duration-200 flex flex-col h-[100px] group"
                >
                  <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-3 w-3" />
                  </div>
                  <h3 className="font-medium text-xs mb-1 line-clamp-1">{service.name}</h3>
                  <p className="text-muted-foreground text-[10px] line-clamp-2">{service.description}</p>
                </Link>
              )
            })}
          </div>
        ) : (
          // Desktop layout - grid
          <div className="grid grid-cols-3 gap-4">
            {(isLoading ? fallbackServices : services).map((service, index) => {
              if (isLoading) {
                return (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm h-[160px] animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-gray-200 mb-2"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-full bg-gray-200 rounded"></div>
                  </div>
                )
              }

              const Icon = iconMap[service.icon as keyof typeof iconMap] || Smartphone
              const serviceUrl = service.slug
                ? `/${locale}/services/${service.slug}`
                : `/${locale}/services/${service.id}`

              return (
                <Link
                  href={serviceUrl}
                  key={service.id}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow transition-all duration-200 flex flex-col h-[160px] group"
                >
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-medium text-base mb-1">{service.name}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{service.description}</p>
                  <div className="mt-auto pt-2">
                    <span className="text-xs text-primary font-medium group-hover:underline">{t("learnMore")} →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="flex justify-center mt-4 md:mt-6">
          <Button asChild size="sm" variant="outline" className="rounded-full text-xs bg-transparent">
            <Link href={`/${locale}/services`}>{t("allServicesButton")}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
