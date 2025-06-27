"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { useParams } from "next/navigation"
import { formatImageUrl } from "@/utils/image-url"

type Brand = {
  id: string
  name: string
  logo_url: string | null
  position: number | null
  slug: string | null
  series:
    | {
        id: string
        name: string
        position: number
        slug: string | null
      }[]
    | null
}

export function BrandsSectionModern() {
  const t = useTranslations("BrandsSection")
  const params = useParams()
  const locale = params.locale as string
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/brands")

        if (!response.ok) {
          throw new Error(`Failed to fetch brands: ${response.status}`)
        }

        const data = await response.json()

        // Sort brands by position first, then by name
        const sortedBrands = [...data].sort((a, b) => {
          // If both have position, sort by position
          if (a.position !== null && b.position !== null) {
            return (a.position || 0) - (b.position || 0)
          }
          // If only one has position, prioritize the one with position
          if (a.position !== null) return -1
          if (b.position !== null) return 1
          // If neither has position, sort by name
          return a.name.localeCompare(b.name)
        })

        setBrands(sortedBrands)
      } catch (err) {
        console.error("Error fetching brands:", err)
        setError("Failed to load brands")
      } finally {
        setLoading(false)
      }
    }

    fetchBrands()
  }, [])

  if (error) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">{t("title")}</h2>
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  // Показуємо тільки перші 6 брендів
  const displayedBrands = brands.slice(0, 6)

  return (
    <section className="py-12 bg-gray-50">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">{t("title")}</h2>
            <p className="text-gray-600 max-w-2xl">{t("description")}</p>
          </div>
          <Link href={`/${locale}/brands`} className="mt-4 md:mt-0">
            <Button variant="outline" className="group bg-transparent">
              {t("allBrandsButton")}
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 flex flex-col items-center justify-center h-[120px]">
                <Skeleton className="h-12 w-12 rounded-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </Card>
            ))}
          </div>
        ) : brands.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {displayedBrands.map((brand, index) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link href={`/${locale}/brands/${brand.slug || brand.id}`}>
                  <Card className="p-6 flex flex-col items-center justify-center h-[120px] transition-all hover:shadow-md hover:scale-105">
                    {brand.logo_url ? (
                      <img
                        src={formatImageUrl(brand.logo_url) || "/placeholder.svg"}
                        alt={brand.name}
                        width={48}
                        height={48}
                        className="h-12 object-contain mb-3"
                        style={{ display: "block" }}
                      />
                    ) : (
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                        <span className="text-primary font-bold">{brand.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-center">{brand.name}</span>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">{t("noBrands")}</p>
        )}
      </div>
    </section>
  )
}
