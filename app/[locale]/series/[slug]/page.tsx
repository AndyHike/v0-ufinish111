import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { createClient } from "@/utils/supabase/client"
import { ArrowLeft, Smartphone } from "lucide-react"
import { ContactCTABanner } from "@/components/contact-cta-banner"
import { Breadcrumb } from "@/components/breadcrumb"
import SeriesPageClient from "./series-page-client"
import { siteUrl } from "@/lib/site-config"
import { PrevNextNav } from "@/components/prev-next-nav"
import { BrandSeoSections } from "@/components/brand-seo-sections"
import { unstable_cache } from "next/cache"

// ISR Configuration
export const revalidate = 3600
export const dynamicParams = true

type Props = {
  params: {
    locale: string
    slug: string
  }
}

export async function generateStaticParams() {
  const supabase = createClient()

  try {
    const { data: seriesList } = await supabase
      .from("series")
      .select("slug")
      .order("position", { ascending: true })
      .limit(50)

    const locales = ["uk", "cs", "en"]

    return (
      seriesList?.flatMap((series) =>
        locales.map((locale) => ({
          locale,
          slug: series.slug,
        }))
      ) || []
    )
  } catch (error) {
    console.error("[v0] Error in generateStaticParams (series):", error)
    return []
  }
}

// Cache series data
const getCachedSeriesData = unstable_cache(
  async (slug: string) => {
    const supabase = await createServerClient()

    let { data: series } = await supabase
      .from("series")
      .select("*, brands(id, name, slug, logo_url), models(id, name, slug, image_url)")
      .eq("slug", slug)
      .single()

    if (!series) {
      const { data } = await supabase
        .from("series")
        .select("*, brands(id, name, slug, logo_url), models(id, name, slug, image_url)")
        .eq("id", slug)
        .single()
      series = data
    }

    if (!series) return null

    return {
      series,
      models: series.models || [],
    }
  },
  ["series"],
  { revalidate: 3600, tags: ["series"] }
)

// Cache sibling series for navigation
const getCachedSiblingSeries = unstable_cache(
  async (brandId: string) => {
    const supabase = await createServerClient()
    const { data: siblingSeries } = await supabase
      .from("series")
      .select("name, slug")
      .eq("brand_id", brandId)
      .order("position", { ascending: true })
    return siblingSeries || []
  },
  ["sibling-series"],
  { revalidate: 3600, tags: ["series"] }
)

// Cache services for SEO section
const getCachedServices = unstable_cache(
  async (locale: string) => {
    const supabase = await createServerClient()
    const { data: topServices } = await supabase
      .from("services")
      .select(`id, slug, position, services_translations(name, locale), model_services(price)`)
      .order("position", { ascending: true })
      .limit(6)

    return (topServices || []).map((svc: any) => {
      const tr = (svc.services_translations as any[])?.find((t: any) => t.locale === locale) ?? svc.services_translations?.[0]
      const prices = (svc.model_services as any[])?.map((ms: any) => ms.price).filter((p: any) => p != null && p > 0)
      return {
        id: svc.id,
        slug: svc.slug,
        name: tr?.name ?? svc.slug,
        minPrice: prices && prices.length > 0 ? Math.min(...prices) : null,
      }
    })
  },
  ["services"],
  { revalidate: 3600, tags: ["services"] }
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const seriesData = await getCachedSeriesData(slug)
  const series = seriesData?.series

  if (!series) {
    return {
      title: "Series Not Found | DeviceHelp",
      description: "The requested series could not be found.",
    }
  }

  const brandName = Array.isArray(series.brands) ? (series.brands as any[])[0]?.name : (series.brands as any)?.name

  const titlePatterns = {
    cs: `Oprava zařízení ${series.name} ${brandName} | DeviceHelp`,
    en: `Repair of ${series.name} ${brandName} devices | DeviceHelp`,
    uk: `Ремонт пристроїв ${series.name} ${brandName} | DeviceHelp`,
  }

  const descriptionPatterns = {
    cs: `Profesionální oprava všech modelů ${series.name} od ${brandName}. Rychlé a kvalitní služby s garancí.`,
    en: `Professional repair of all ${series.name} models from ${brandName}. Fast and quality services with warranty.`,
    uk: `Професійний ремонт усіх моделей ${series.name} від ${brandName}. Швидкі та якісні послуги з гарантією.`,
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
    openGraph: {
      title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
      description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
      url: `${siteUrl}/${locale}/series/${slug}`,
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/series/${slug}`,
      languages: {
        cs: `${siteUrl}/cs/series/${slug}`,
        en: `${siteUrl}/en/series/${slug}`,
        uk: `${siteUrl}/uk/series/${slug}`,
        "x-default": `${siteUrl}/cs/series/${slug}`,
      },
    },
  }
}

export default async function SeriesPage({ params }: Props) {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: "Series" })

  const seriesData = await getCachedSeriesData(slug)

  if (!seriesData?.series) {
    notFound()
  }

  const { series, models } = seriesData
  const initialData = { series, models }

  // Fetch navigation data
  const brandId = Array.isArray(series.brands) ? (series.brands as any[])[0]?.id : (series.brands as any)?.id
  const siblingSeries = brandId ? await getCachedSiblingSeries(brandId) : []

  const seriesIndex = siblingSeries?.findIndex((s) => s.slug === slug) ?? -1
  const prevSeries = seriesIndex > 0 ? siblingSeries![seriesIndex - 1] : null
  const nextSeries = siblingSeries && seriesIndex >= 0 && seriesIndex < siblingSeries.length - 1 ? siblingSeries[seriesIndex + 1] : null

  // Fetch services
  const seoServices = await getCachedServices(locale)

  return (
    <div className="flex flex-col min-h-screen">
      <div className="order-1">
        <SeriesPageClient initialData={initialData} locale={locale} slug={slug} />
      </div>

      <div className="order-2 w-full">
        <BrandSeoSections locale={locale} services={seoServices} />
      </div>

      <div className="order-3 container mx-auto px-4 pb-10 pt-4 w-full">
        <div className="mt-8 mb-8">
          <ContactCTABanner locale={locale} />
        </div>
        <div className="mt-8">
          <PrevNextNav
            prev={prevSeries ? { name: prevSeries.name, href: `/${locale}/series/${prevSeries.slug}` } : null}
            next={nextSeries ? { name: nextSeries.name, href: `/${locale}/series/${nextSeries.slug}` } : null}
            label="Navigate series"
          />
        </div>
      </div>
    </div>
  )
}
