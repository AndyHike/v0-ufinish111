"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Smartphone, Battery, Wifi, Shield, Droplet, Brush } from "lucide-react"
import { useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

export function ServicesSection() {
  const t = useTranslations("Services")
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Define the services with their icons
  const services = [
    {
      id: "1",
      icon: Smartphone,
      titleKey: "service1.title",
      descriptionKey: "service1.description",
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: "2",
      icon: Battery,
      titleKey: "service2.title",
      descriptionKey: "service2.description",
      color: "bg-green-50 text-green-600",
    },
    {
      id: "3",
      icon: Wifi,
      titleKey: "service3.title",
      descriptionKey: "service3.description",
      color: "bg-purple-50 text-purple-600",
    },
    {
      id: "4",
      icon: Shield,
      titleKey: "service4.title",
      descriptionKey: "service4.description",
      color: "bg-amber-50 text-amber-600",
    },
    {
      id: "5",
      icon: Brush,
      titleKey: "phoneCleaning.title",
      descriptionKey: "phoneCleaning.description",
      color: "bg-teal-50 text-teal-600",
    },
    {
      id: "6",
      icon: Droplet,
      titleKey: "waterDamage.title",
      descriptionKey: "waterDamage.description",
      color: "bg-cyan-50 text-cyan-600",
    },
  ]

  useEffect(() => {
    // Simulate loading for a brief moment
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

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
            {isLoading
              ? Array(4)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 bg-white rounded-lg p-3 shadow-sm h-[100px] animate-pulse"
                    >
                      <div className="h-6 w-6 rounded-full bg-gray-200 mb-2"></div>
                      <div className="h-3 w-2/3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 w-full bg-gray-200 rounded"></div>
                    </div>
                  ))
              : services.slice(0, 4).map((service) => {
                  const Icon = service.icon
                  return (
                    <Link
                      href="/services"
                      key={service.id}
                      className="bg-white rounded-lg p-3 shadow-sm hover:shadow transition-all duration-200 flex flex-col h-[100px] group"
                    >
                      <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full ${service.color}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <h3 className="font-medium text-xs mb-1 line-clamp-1">{t(service.titleKey)}</h3>
                      <p className="text-muted-foreground text-[10px] line-clamp-2">{t(service.descriptionKey)}</p>
                    </Link>
                  )
                })}
          </div>
        ) : (
          // Desktop layout - grid
          <div className="grid grid-cols-3 gap-4">
            {isLoading
              ? Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 shadow-sm h-[160px] animate-pulse">
                      <div className="h-8 w-8 rounded-full bg-gray-200 mb-2"></div>
                      <div className="h-4 w-2/3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-full bg-gray-200 rounded"></div>
                    </div>
                  ))
              : services.map((service) => {
                  const Icon = service.icon
                  return (
                    <Link
                      href="/services"
                      key={service.id}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow transition-all duration-200 flex flex-col h-[160px] group"
                    >
                      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${service.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="font-medium text-base mb-1">{t(service.titleKey)}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">{t(service.descriptionKey)}</p>
                      <div className="mt-auto pt-2">
                        <span className="text-xs text-primary font-medium group-hover:underline">
                          {t("learnMore")} →
                        </span>
                      </div>
                    </Link>
                  )
                })}
          </div>
        )}

        <div className="flex justify-center mt-4 md:mt-6">
          <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
            <Link href="/services">{t("allServicesButton")}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
