"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Smartphone, ArrowRight } from "lucide-react"
import { formatImageUrl } from "@/utils/image-url"

interface Brand {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  position: number
}

export function BrandsSectionModern() {
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
          setBrands(data.slice(0, 8)) // Show only first 8 brands
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
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-lg animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-xl mx-auto mb-6"></div>
                <div className="h-4 bg-gray-200 rounded mx-auto w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            {t("supportedBrands")}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t("brandsDescription") || "Ремонтуємо пристрої всіх популярних брендів з гарантією якості"}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/${locale}/brands/${brand.slug || brand.id}`}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 mb-6 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
                  {brand.logo_url ? (
                    <img
                      src={formatImageUrl(brand.logo_url) || "/placeholder.svg"}
                      alt={brand.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                      style={{ display: "block" }}
                    />
                  ) : (
                    <Smartphone className="w-10 h-10 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-center group-hover:text-blue-600 transition-colors">
                  {brand.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link
            href={`/${locale}/brands`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors group"
          >
            {t("viewAllBrands") || "Переглянути всі бренди"}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
