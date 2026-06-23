"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Search, Smartphone, Wrench } from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { useGlobalData } from "@/hooks/use-global-data"
import { useEffect, useMemo, useRef, useState } from "react"
import { formatCurrency } from "@/lib/format-currency"

type SeriesService = {
  id: string
  slug: string
  name: string
  minPrice: number | null
}

type SeriesData = {
  series: any
  models: any[]
}

type Props = {
  initialData: SeriesData
  locale: string
  slug: string
  services?: SeriesService[]
  brandSlug?: string | null
  description?: string | null
  body?: string | null
}

const COPY = {
  cs: {
    services: "Opravy pro tuto řadu",
    from: "od",
    searchModel: "Hledat model…",
    noModels: "Žádný model neodpovídá hledání",
  },
  uk: {
    services: "Ремонт для цієї лінійки",
    from: "від",
    searchModel: "Пошук моделі…",
    noModels: "Жодна модель не відповідає пошуку",
  },
  en: {
    services: "Repairs for this line",
    from: "from",
    searchModel: "Search model…",
    noModels: "No model matches your search",
  },
} as const

export default function SeriesPageClient({
  initialData,
  locale,
  slug,
  services = [],
  brandSlug,
  description,
  body,
}: Props) {
  const t = useTranslations("Series")
  const brandsT = useTranslations("Brands")
  const { setCachedSeries } = useGlobalData()
  const copy = COPY[locale as keyof typeof COPY] || COPY.cs

  const [query, setQuery] = useState("")

  // Use initialData directly - no need for SWR fetch on client
  // Data is already rendered on server via ISR, no need for additional fetch
  const seriesData = initialData

  useEffect(() => {
    // Store in context for subsequent navigations
    if (seriesData?.series) {
      setCachedSeries(slug, seriesData.series)
    }
  }, [slug, setCachedSeries, seriesData])

  const { series, models } = seriesData || {}

  const filteredModels = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return models || []
    return (models || []).filter((m: any) => m.name?.toLowerCase().includes(q))
  }, [models, query])

  // If no data at all
  if (!seriesData?.series) {
    return null
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: brandsT("allBrands") || "Всі бренди", href: `/${locale}/brands` },
              {
                label: series.brands?.name || "Brand",
                href: `/${locale}/brands/${String(series.brands?.slug || series.brand_id).toLowerCase()}`,
              },
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
                {description || t("seriesPageDescription", { series: series.name, brand: series.brands?.name })}
              </p>
            </div>
          </div>
        </div>

        {/* Optional longer unique content block (SEO) */}
        {body && (
          <div className="mb-12 rounded-xl bg-white p-8 shadow-sm">
            <div className="prose prose-slate max-w-none whitespace-pre-line text-muted-foreground">{body}</div>
          </div>
        )}

        {/* Компактні міні-чіпи послуг для цієї лінійки → хаби бренд×послуга */}
        {services.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Wrench className="h-3.5 w-3.5" />
              {copy.services}
            </h2>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {services.map((svc) => {
                const href = brandSlug
                  ? `/${locale}/services/${svc.slug}/brand/${brandSlug}#series-${series.slug}`
                  : `/${locale}/services/${svc.slug}`
                return (
                  <Link
                    key={svc.id}
                    href={href}
                    className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600"
                  >
                    <span>{svc.name}</span>
                    {svc.minPrice != null && (
                      <span className="text-xs text-muted-foreground">
                        {copy.from} {formatCurrency(svc.minPrice)}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Розділ моделей */}
        <div>
          <h2 className="mb-6 border-b pb-2 text-2xl font-bold">
            {t("availableModels") || "Доступні моделі"}
          </h2>

          {models && models.length > 0 && (
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={copy.searchModel}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {filteredModels && filteredModels.length > 0 ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredModels.map((model: any) => (
                <Link
                  key={model.id}
                  href={`/${locale}/models/${model.slug || model.id}`}
                  className="group flex flex-col items-center rounded-lg bg-white p-4 shadow-sm hover:shadow"
                >
                  <div
                    className={`mb-4 relative h-24 w-24 flex-shrink-0 rounded-lg sm:h-28 sm:w-28 overflow-hidden flex items-center justify-center ${
                      model.image_url ? "" : "bg-slate-50 p-2"
                    }`}
                  >
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
          ) : models && models.length > 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-muted-foreground">{copy.noModels}</p>
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
