import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
// import { createServerClient } removed
import { createClient } from "@/utils/supabase/client"
import { ArrowLeft, Smartphone } from "lucide-react"
import { ContactCTABanner } from "@/components/contact-cta-banner"
import { Breadcrumb } from "@/components/breadcrumb"
import SeriesPageClient from "./series-page-client"
import { siteUrl } from "@/lib/site-config"
import { PrevNextNav } from "@/components/prev-next-nav"
import { BrandSeoSections } from "@/components/brand-seo-sections"

// ISR Configuration
export const revalidate = 3600 // Regenerate every 1 hour
export const dynamicParams = true // Allow new slugs on-the-fly

type Props = {
  params: {
    locale: string
    slug: string
  }
}

// Pre-render popular series at build time
export async function generateStaticParams() {
  // Use public client for build-time static generation
  const supabase = createClient()

  try {
    const { data: seriesList } = await supabase
      .from("series")
      .select("slug")
      .order("position", { ascending: true })
      .limit(50) // Pre-render top 50 series

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params

  const supabase = createClient()

  // Спочатку спробуємо знайти за слагом
  let { data: series } = await supabase.from("series").select("*, brands(name)").eq("slug", slug).single()

  // Якщо не знайдено за слагом, спробуємо знайти за ID
  if (!series) {
    const { data } = await supabase.from("series").select("*, brands(name)").eq("id", slug).single()
    series = data
  }

  if (!series) {
    const titlePatterns = {
      cs: "Série nenalezena | DeviceHelp",
      en: "Series not found | DeviceHelp",
      uk: "Серію не знайдено | DeviceHelp",
    }

    const descriptionPatterns = {
      cs: "Požadovaná série zařízení nebyla nalezena.",
      en: "The requested device series could not be found.",
      uk: "Запитувану серію пристроїв не вдалося знайти.",
    }

    return {
      title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
      description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
    }
  }

  const titlePatterns = {
    cs: `Oprava zařízení ${series.name} ${series.brands?.name} | DeviceHelp`,
    en: `Repair of ${series.name} ${series.brands?.name} devices | DeviceHelp`,
    uk: `Ремонт пристроїв ${series.name} ${series.brands?.name} | DeviceHelp`,
  }

  const descriptionPatterns = {
    cs: `Profesionální oprava všech modelů ${series.name} od ${series.brands?.name}. Rychlé a kvalitní služby s garancí.`,
    en: `Professional repair of all ${series.name} models from ${series.brands?.name}. Fast and quality services with warranty.`,
    uk: `Професійний ремонт усіх моделей ${series.name} від ${series.brands?.name}. Швидкі та якісні послуги з гарантією.`,
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

  const supabase = createClient()

  // Спочатку спробуємо знайти за слагом
  let { data: series, error: seriesError } = await supabase
    .from("series")
    .select("*, brands(id, name, slug, logo_url)")
    .eq("slug", slug)
    .single()

  // Якщо не знайдено за слагом, спробуємо знайти за ID
  if (!series) {
    const { data, error } = await supabase
      .from("series")
      .select("*, brands(id, name, slug, logo_url)")
      .eq("id", slug)
      .single()

    series = data
    seriesError = error
  }

  if (seriesError || !series) {
    notFound()
  }

  // Fetch models for this series
  const { data: models, error: modelsError } = await supabase
    .from("models")
    .select("id, name, slug, image_url, created_at")
    .eq("series_id", series.id)
    .order("position", { ascending: true })

  const initialData = {
    series,
    models: models || [],
  }

  // Fetch prev/next series in same brand for navigation
  const brandId = Array.isArray(series.brands) ? (series.brands as any[])[0]?.id : (series.brands as any)?.id
  const { data: siblingSeries } = brandId
    ? await supabase
      .from("series")
      .select("name, slug")
      .eq("brand_id", brandId)
      .order("position", { ascending: true })
    : { data: null }

  const seriesIndex = siblingSeries?.findIndex((s) => s.slug === slug) ?? -1
  const prevSeries = seriesIndex > 0 ? siblingSeries![seriesIndex - 1] : null
  const nextSeries = siblingSeries && seriesIndex >= 0 && seriesIndex < siblingSeries.length - 1
    ? siblingSeries[seriesIndex + 1]
    : null

  // Fetch popular services for BrandSeoSections
  const { data: topServices } = await supabase
    .from("services")
    .select(`id, slug, position, services_translations(name, locale), model_services(price)`)
    .order("position", { ascending: true })
    .limit(6)

  const seoServices = (topServices || []).map((svc: any) => {
    const tr = (svc.services_translations as any[])?.find((t: any) => t.locale === locale) ?? svc.services_translations?.[0]
    const prices = (svc.model_services as any[])?.map((ms: any) => ms.price).filter((p: any) => p != null && p > 0)
    return {
      id: svc.id,
      slug: svc.slug,
      name: tr?.name ?? svc.slug,
      minPrice: prices && prices.length > 0 ? Math.min(...prices) : null,
    }
  })

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
