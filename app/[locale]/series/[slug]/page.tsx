import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
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
import { resolveCatalogField, type CatalogDescriptionRow } from "@/lib/catalog/catalog-text"

// ISR Configuration
export const revalidate = 3600 // Regenerate every 1 hour
export const dynamicParams = true // Allow new slugs on-the-fly

type Props = {
  params: Promise<{
    locale: string
    slug: string
  }>
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
      seriesList
        ?.filter((series) => typeof series.slug === 'string' && series.slug.trim() !== '')
        .flatMap((series) =>
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

  // Services available for this line, with the cheapest price across its models.
  // Powers the "service cards" grid + deep-links into the brand×service hub.
  const brandObj = Array.isArray(series.brands) ? (series.brands as any[])[0] : (series.brands as any)
  const brandSlug = brandObj?.slug ? String(brandObj.slug).toLowerCase() : null

  const modelIds = (models || []).map((m: any) => m.id)
  let seriesServices: { id: string; slug: string; name: string; minPrice: number | null }[] = []
  if (modelIds.length > 0) {
    const { data: msRows } = await supabase
      .from("model_services")
      .select("price, services(id, slug, position, services_translations(name, locale))")
      .in("model_id", modelIds)

    const svcMap = new Map<string, { id: string; slug: string; name: string; position: number; minPrice: number | null }>()
    for (const row of (msRows || []) as any[]) {
      const svc = Array.isArray(row.services) ? row.services[0] : row.services
      if (!svc?.id || !svc?.slug) continue
      const tr =
        (svc.services_translations as any[])?.find((t: any) => t.locale === locale) ?? svc.services_translations?.[0]
      const entry =
        svcMap.get(svc.id) ?? {
          id: svc.id,
          slug: svc.slug,
          name: tr?.name ?? svc.slug,
          position: svc.position ?? 999,
          minPrice: null,
        }
      if (row.price != null && row.price > 0) {
        entry.minPrice = entry.minPrice == null ? row.price : Math.min(entry.minPrice, row.price)
      }
      svcMap.set(svc.id, entry)
    }
    seriesServices = Array.from(svcMap.values())
      .sort((a, b) => a.position - b.position)
      .map(({ id, slug, name, minPrice }) => ({ id, slug, name, minPrice }))
  }

  // Unique page description (series-scope, falling back to brand-scope, then the
  // generic templated line). Table is empty until the owner adds content → no regression.
  const descBrandId = brandObj?.id ?? null
  const descScopeIds = [series.id, descBrandId].filter(Boolean) as string[]
  let seriesDescription: string | null = null
  let seriesBody: string | null = null
  if (descScopeIds.length > 0) {
    const { data: descRows } = await supabase
      .from("catalog_descriptions")
      .select("scope_type, scope_id, locale, description, body")
      .in("scope_type", ["series", "brand"])
      .in("scope_id", descScopeIds)

    const rows = (descRows || []) as CatalogDescriptionRow[]
    const order = [
      { type: "series" as const, id: series.id },
      { type: "brand" as const, id: descBrandId },
    ]
    seriesDescription = resolveCatalogField("description", locale, rows, order)
    seriesBody = resolveCatalogField("body", locale, rows, order)
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
        <SeriesPageClient
          initialData={initialData}
          locale={locale}
          slug={slug}
          services={seriesServices}
          brandSlug={brandSlug}
          description={seriesDescription}
          body={seriesBody}
        />
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
