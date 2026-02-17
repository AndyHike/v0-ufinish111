"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Smartphone } from "lucide-react"
import { ContactCTABanner } from "@/components/contact-cta-banner"
import { Breadcrumb } from "@/components/breadcrumb"
import { useGlobalData } from "@/hooks/use-global-data"
import { useEffect, useState } from "react"
import useSWR from "swr"

type SeriesData = {
  series: any
  models: any[]
}

type Props = {
  initialData: SeriesData
  locale: string
  slug: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SeriesPageClient({ initialData, locale, slug }: Props) {
  const t = useTranslations("Series")
  const { setCachedSeries } = useGlobalData()
  const [mounted, setMounted] = useState(false)

  // SWR для кешування та фонового оновлення
  const { data, isLoading } = useSWR(`/api/series/${slug}`, fetcher, {
    fallbackData: initialData,
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  })

  useEffect(() => {
    setMounted(true)
    console.log("[v0] SeriesPageClient mounted - initialData:", initialData)
    console.log("[v0] SeriesPageClient - SWR data:", data)
    // Зберігаємо в контекст для наступних навігацій
    if (data?.series) {
      console.log("[v0] SeriesPageClient - Caching series:", data.series.slug)
      setCachedSeries(slug, data)
    }
  }, [data, slug, setCachedSeries])

  if (!mounted) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
          <div className="h-32 rounded bg-slate-200 animate-pulse" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-40 rounded bg-slate-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data?.series) {
    console.warn("[v0] SeriesPageClient - No data available:", { data, initialData })
    return null
  }

  const { series, models } = data

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
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

        <ContactCTABanner locale={locale} />
      </div>
    </div>
  )
}
