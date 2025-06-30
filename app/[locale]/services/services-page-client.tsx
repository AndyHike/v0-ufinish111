"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ArrowRight, Smartphone, Battery, Wifi, Shield, Droplet, Brush } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

interface ServicesPageClientProps {
  services: any[]
  locale: string
  translations: {
    [key: string]: string
  }
}

export function ServicesPageClient({ services, locale, translations }: ServicesPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("popular")

  // Icon mapping
  const iconMap = {
    smartphone: Smartphone,
    battery: Battery,
    wifi: Wifi,
    shield: Shield,
    droplet: Droplet,
    brush: Brush,
  }

  // Фільтрація та сортування послуг
  const filteredAndSortedServices = useMemo(() => {
    const filtered = services.filter((service) => {
      const serviceName =
        service.service_descriptions?.find((desc: any) => desc.language === locale)?.name || service.name || ""

      return serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    })

    // Сортування
    switch (sortBy) {
      case "priceAsc":
        return filtered.sort((a, b) => (a.stats?.minPrice || 0) - (b.stats?.minPrice || 0))
      case "priceDesc":
        return filtered.sort((a, b) => (b.stats?.minPrice || 0) - (a.stats?.minPrice || 0))
      case "newest":
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case "popular":
      default:
        return filtered.sort((a, b) => (b.stats?.modelsCount || 0) - (a.stats?.modelsCount || 0))
    }
  }, [services, searchTerm, sortBy, locale])

  const handleServiceClick = (serviceName: string) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("trackCustom", "ServicePageView", {
        service_name: serviceName,
        source: "services_listing",
        timestamp: new Date().toISOString(),
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">{translations.title}</h1>
            <p className="text-base md:text-lg text-gray-600 mb-8">{translations.subtitle}</p>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={translations.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">{translations.popular}</SelectItem>
                  <SelectItem value="newest">{translations.newest}</SelectItem>
                  <SelectItem value="priceAsc">{translations.priceAsc}</SelectItem>
                  <SelectItem value="priceDesc">{translations.priceDesc}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {filteredAndSortedServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{translations.noServicesFound}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedServices.map((service) => {
                const serviceDescription =
                  service.service_descriptions?.find((desc: any) => desc.language === locale) ||
                  service.service_descriptions?.[0] ||
                  {}

                const serviceName = serviceDescription.name || service.name
                const serviceDesc = serviceDescription.description || service.description
                const Icon = iconMap[service.icon as keyof typeof iconMap] || Smartphone

                return (
                  <Link
                    key={service.id}
                    href={`/${locale}/services/${service.slug || service.id}`}
                    className="block group"
                    onClick={() => handleServiceClick(serviceName)}
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          {service.stats?.modelsCount > 0 && (
                            <Badge variant="secondary">
                              {service.stats.modelsCount} {translations.models}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {serviceName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{serviceDesc}</p>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {service.stats?.minPrice > 0 && (
                              <span className="font-medium text-primary">
                                {translations.from} {formatCurrency(service.stats.minPrice)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                            {translations.learnMore}
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </div>
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
    </div>
  )
}
