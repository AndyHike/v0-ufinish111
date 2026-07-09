"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { ChevronRight, Smartphone, Wrench } from "lucide-react"
import { formatImageUrl } from "@/utils/image-url"
import { Breadcrumb } from "@/components/breadcrumb"
import { useGlobalData } from "@/hooks/use-global-data"
import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/format-currency"

type BrandData = {
  brand: any
  modelsWithoutSeries: any[]
}

type BrandService = {
  id: string
  slug: string
  name: string
  minPrice: number | null
}

type Props = {
  initialData: BrandData
  locale: string
  slug: string
  services?: BrandService[]
  brandSlug?: string | null
}

const SERVICES_COPY = {
  cs: { services: "Opravy pro tuto značku", from: "od" },
  uk: { services: "Ремонт для цього бренду", from: "від" },
  en: { services: "Repairs for this brand", from: "from" },
} as const

export default function BrandPageClient({ initialData, locale, slug, services = [], brandSlug }: Props) {
  const t = useTranslations("Brands")
  const { setCachedBrand } = useGlobalData()
  const servicesCopy = SERVICES_COPY[locale as keyof typeof SERVICES_COPY] || SERVICES_COPY.cs

  // Use initialData directly - no need for SWR fetch on client
  // Data is already rendered on server via ISR, no need for additional fetch
  const brandData = initialData

  useEffect(() => {
    // Store in context for subsequent navigations
    if (brandData?.brand) {
      setCachedBrand(slug, brandData.brand)
    }
  }, [slug, setCachedBrand, brandData])

  // If no data at all
  if (!brandData?.brand) {
    return null
  }

  const { brand, modelsWithoutSeries } = brandData
  const repairTitle = t("repairBrandTitle", { brand: brand.name })

  const hasModelsWithoutSeries = modelsWithoutSeries && modelsWithoutSeries.length > 0

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: t("allBrands") || "Всі бренди", href: `/${locale}/brands` },
              { label: brand.name, href: `/${locale}/brands/${String(brand.slug || slug).toLowerCase()}` }
            ]}
          />
        </div>

        {/* Заголовок бренду */}
        <div className="mb-12 flex flex-col items-center gap-6 rounded-xl bg-white p-8 shadow-sm md:flex-row">
          <div className="relative h-32 w-32 overflow-hidden rounded-xl bg-slate-50 p-4">
            <img
              src={formatImageUrl(brand.logo_url) || "/placeholder.svg?height=128&width=128&query=phone+brand+logo"}
              alt={brand.name}
              width={128}
              height={128}
              className="object-contain w-full h-full"
              style={{ display: "block" }}
            />
          </div>
          <div>
            <h1 className="text-center text-3xl font-bold tracking-tight md:text-left md:text-4xl">
              {repairTitle}
            </h1>
            <p className="mt-3 max-w-[900px] text-center text-muted-foreground md:text-left">
              {t("brandPageDescription", { brand: brand.name })}
            </p>
          </div>
        </div>

        {/* Компактні міні-чіпи послуг для цього бренду → хаби бренд×послуга
            (дзеркало блоку на сторінці серії; годує хаби вагою з рівня 1) */}
        {services.length > 0 && brandSlug && (
          <div className="mb-8">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Wrench className="h-3.5 w-3.5" />
              {servicesCopy.services}
            </h2>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {services.map((svc) => (
                <Link
                  key={svc.id}
                  href={`/${locale}/services/${svc.slug}/brand/${brandSlug}`}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600"
                >
                  <span>{svc.name}</span>
                  {svc.minPrice != null && (
                    <span className="text-xs text-muted-foreground">
                      {servicesCopy.from} {formatCurrency(svc.minPrice)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Розділ серій */}
        {brand.series && brand.series.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-8 inline-block border-b-2 border-primary pb-2 text-2xl font-bold">
              {t("productLines") || "Лінійки продуктів"}
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {brand.series.map((series: any) => (
                <Link
                  key={series.id}
                  href={`/${locale}/series/${series.slug || series.id}`}
                  className="group relative overflow-hidden rounded-lg bg-white p-5 shadow-md transition-all hover:shadow-lg"
                >
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary"></div>

                  <div className="flex items-center gap-4">
                    {series.image_url && (
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-20">
                        <img
                          src={formatImageUrl(series.image_url)}
                          alt={series.name}
                          width={80}
                          height={80}
                          className="h-full w-full object-contain"
                          style={{ display: "block" }}
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-medium text-slate-800 group-hover:text-primary">
                        {series.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {t("viewAllModels") || "Переглянути всі моделі"}
                      </p>
                    </div>
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Розділ моделей без серії */}
        {hasModelsWithoutSeries && (
          <div>
            <h2 className="mb-6 inline-block border-b-2 border-primary pb-2 text-2xl font-bold">
              {brand.series && brand.series.length > 0
                ? t("otherModels") || "Інші моделі"
                : t("availableModels") || "Доступні моделі"}
            </h2>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {modelsWithoutSeries.map((model: any) => (
                <Link
                  href={`/${locale}/models/${model.slug || model.id}`}
                  key={model.id}
                  className="group flex flex-col items-center rounded-lg bg-white p-4 shadow-sm hover:shadow"
                >
                  <div
                    className={`mb-4 flex h-20 w-20 items-center justify-center rounded-lg sm:h-24 sm:w-24 ${
                      model.image_url ? "" : "bg-slate-50 p-2"
                    }`}
                  >
                    {model.image_url ? (
                      <img
                        src={formatImageUrl(model.image_url) || "/placeholder.svg"}
                        alt={model.name}
                        width={96}
                        height={96}
                        className="h-full w-full object-contain"
                        style={{ display: "block" }}
                      />
                    ) : (
                      <Smartphone className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <h3 className="text-center text-base font-medium group-hover:text-primary sm:text-lg">
                    {model.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Порожня сторінка */}
        {(!brand.series || brand.series.length === 0) && !hasModelsWithoutSeries && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-muted-foreground">{t("noModelsAvailable", { brand: brand.name })}</p>
          </div>
        )}

      </div>
    </div>
  )
}
