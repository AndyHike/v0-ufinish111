"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { SeriesList } from "@/components/admin/series-list"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default function BrandSeriesPage() {
  const t = useTranslations("Admin")
  const params = useParams()
  const brandId = params.id as string
  const [brandName, setBrandName] = useState("")

  useEffect(() => {
    async function fetchBrandDetails() {
      try {
        const response = await fetch(`/api/admin/brands/${brandId}`)
        if (response.ok) {
          const data = await response.json()
          setBrandName(data.name)
        }
      } catch (error) {
        console.error("Error fetching brand details:", error)
      }
    }

    if (brandId) {
      fetchBrandDetails()
    }
  }, [brandId])

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/admin/brands">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("backToBrands") || "Back to Brands"}
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {brandName ? `${brandName} - ${t("series") || "Series"}` : t("series") || "Series"}
        </h1>
        <p className="text-muted-foreground">{t("manageBrandSeries") || "Manage product series for this brand"}</p>
      </div>

      <SeriesList brandId={brandId} />
    </div>
  )
}
