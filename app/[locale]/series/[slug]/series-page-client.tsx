"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Smartphone } from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { useGlobalData } from "@/hooks/use-global-data"
import { useEffect, useRef } from "react"

type SeriesData = {
  series: any
  models: any[]
}

type Props = {
  initialData: SeriesData
  locale: string
  slug: string
}

export default function SeriesPageClient({ initialData, locale, slug }: Props) {
  const t = useTranslations("Series")
  const commonT = useTranslations("Common")
  const brandsT = useTranslations("Brands")
  const { setCachedSeries } = useGlobalData()
  const viewContentSent = useRef(false)

  // Use initialData directly - no need for SWR fetch on client
  // Data is already rendered on server via ISR, no need for additional fetch
  const seriesData = initialData

  useEffect(() => {
    // Store in context for subsequent navigations
    if (seriesData?.series) {
      setCachedSeries(slug, seriesData)
    }
  }, [slug, setCachedSeries, seriesData])

  // If no data at all
  if (!seriesData?.series) {
    return null
  }

  const { series, models } = seriesData

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: brandsT("allBrands") || "Всі бренди", href: `/${locale}/brands` },
              { label: series.brands?.name || "Brand", href: `/${locale}/brands/${series.brands?.slug || series.brand_id}` },
              { label: series.name, href: `/${locale}/series/${series.slug}` },
            ]}
          />
        </div>

        {/* Заголовок серії */}
        <div className="mb-12 rounded-xl bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            {series.brands?.logo_url && (
              <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-slate-50 p-3 flex-shrink-0">
                <Image
                  src={series.brands.logo_url}
                  alt={series.brands?.name || "Brand"}
                  width={96}
                  height={96}
                  className="h-full w-full object-contain"
                  quality={80}
                  priority={true}
                />
              </div>
            )}
            <div>
              <h1 className="text-center text-3xl font-bold tracking-tight md:text-left md:text-4xl">
                {series.name}
              </h1>
              <p className="mt-3 max-w-[900px] text-center text-muted-foreground md:text-left">
                {t("seriesPageDescription", { series: series.name, brand: series.brands?.name })}
              </p>
            </div>
          </div>
        </div>

        {/* Розділ моделей */}
        <div>
          <h2 className="mb-6 border-b pb-2 text-2xl font-bold">
            {t("availableModels") || "Доступні моделі"}
          </h2>

          {models && models.length > 0 ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {models.map((model: any) => (
                <Link
                  key={model.id}
                  href={`/${locale}/models/${model.slug || model.id}`}
                  className="group flex flex-col items-center rounded-lg bg-white p-4 shadow-sm hover:shadow"
                >
                  <div className="mb-4 relative h-24 w-24 flex-shrink-0 rounded-lg bg-slate-50 p-2 sm:h-28 sm:w-28 overflow-hidden flex items-center justify-center">
                    {model.image_url ? (
                      <Image
                        src={model.image_url}
                        alt={model.name}
                        width={112}
                        height={112}
                        className="h-full w-full object-contain"
                        quality={75}
                        priority={false}
                        sizes="(max-width: 640px) 96px, 112px"
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
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-muted-foreground">{t("noModelsAvailable") || "Моделі недоступні"}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
