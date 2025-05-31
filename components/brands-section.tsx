"use client"

import { useEffect, useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Оновимо тип Brand, щоб включити серії
type Brand = {
  id: string
  name: string
  logo_url: string | null
  position: number | null
  series:
    | {
        id: string
        name: string
        position: number
      }[]
    | null
}

export function BrandsSection() {
  const t = useTranslations("BrandsSection")
  const locale = useLocale()
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
        console.log("Fetched brands:", data)

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

  // Determine if we should center the brands (when there are few)
  const shouldCenterBrands = brands.length <= 3

  return (
    <section className="py-12 bg-gray-50">
      <div className="container px-4 mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">{t("title")}</h2>
        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">{t("description")}</p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-none shadow-sm">
                <CardContent className="p-6 flex items-center justify-center">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : brands.length > 0 ? (
          <div className="relative max-w-4xl mx-auto">
            {/* Custom navigation arrows positioned outside the content */}
            {brands.length > 3 && (
              <button
                onClick={() => document.getElementById("brands-scroll")?.scrollBy(-200, 0)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-md z-10 hidden md:flex"
                aria-label="Previous brands"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            <div id="brands-scroll" className="scrollbar-hide">
              <div
                className={`flex overflow-x-auto gap-6 pb-4 snap-x scrollbar-hide ${
                  shouldCenterBrands ? "justify-center" : ""
                }`}
                style={{ scrollBehavior: "smooth" }}
              >
                {brands.map((brand) => (
                  <div key={brand.id} className="flex-none w-[200px] snap-start">
                    <Link href={`/brands/${brand.id}`}>
                      <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 h-32">
                        <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                          {brand.logo_url ? (
                            <div className="relative h-16 w-full">
                              <Image
                                src={brand.logo_url || "/placeholder.svg"}
                                alt={brand.name}
                                width={120}
                                height={80}
                                className="object-contain mx-auto"
                                style={{ maxHeight: "100%", width: "auto" }}
                              />
                            </div>
                          ) : (
                            <div className="text-lg font-medium">{brand.name}</div>
                          )}
                          <span className="mt-2 text-sm text-center">{brand.name}</span>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {brands.length > 3 && (
              <button
                onClick={() => document.getElementById("brands-scroll")?.scrollBy(200, 0)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-md z-10 hidden md:flex"
                aria-label="Next brands"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500">{t("noBrands")}</p>
        )}

        <div className="text-center mt-8">
          <Button asChild variant="outline">
            <Link href="/brands">{t("allBrandsButton")}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
