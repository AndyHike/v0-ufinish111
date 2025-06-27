"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Smartphone } from "lucide-react"
import { formatImageUrl } from "@/utils/image-url"

interface Brand {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  position: number
}

export function BrandsSection() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const locale = useLocale()
  const t = useTranslations("Home")

  useEffect(() => {
    async function fetchBrands() {
      try {
        const response = await fetch("/api/brands")
        if (response.ok) {
          const data = await response.json()
          setBrands(data)
        }
      } catch (error) {
        console.error("Error fetching brands:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBrands()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t("supportedBrands")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mx-auto w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">{t("supportedBrands")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/${locale}/brands/${brand.slug || brand.id}`}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 mb-4 flex items-center justify-center bg-gray-50 rounded-lg p-2">
                  {brand.logo_url ? (
                    <img
                      src={formatImageUrl(brand.logo_url) || "/placeholder.svg"}
                      alt={brand.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-contain"
                      style={{ display: "block" }}
                    />
                  ) : (
                    <Smartphone className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h3 className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                  {brand.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
