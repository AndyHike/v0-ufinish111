import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import ServicePageClient from "./service-page-client"
import { getPriceWithDiscount } from "@/lib/discounts/get-applicable-discounts"
import { DeviceSelectionWrapper } from "./device-selection-wrapper"
import { toOGLocale } from "@/lib/og-locale"
import { siteUrl } from "@/lib/site-config"
import { getTranslations } from "next-intl/server"
import { ContactCTABanner } from "@/components/contact-cta-banner"
import { Breadcrumb } from "@/components/breadcrumb"
import { Wrench, CheckCircle, ShieldCheck, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { BrandSeoSections } from "@/components/brand-seo-sections"

// ISR Configuration
export const revalidate = 3600 // Regenerate every 1 hour
export const dynamicParams = true // Allow new slugs on-the-fly

type Props = {
  params: Promise<{
    locale: string
    slug: string
  }>
  searchParams: Promise<{
    model?: string
  }>
}

// Pre-render popular services
export async function generateStaticParams() {
  const supabase = createClient()

  try {
    const { data: services } = await supabase
      .from("services")
      .select("slug")
      .order("position", { ascending: true })
      .limit(20)

    const locales = ["uk", "cs", "en"]

    return (
      services
        ?.filter((service) => typeof service.slug === 'string' && service.slug.trim() !== '')
        .flatMap((service) =>
          locales.map((locale) => ({
            locale,
            slug: service.slug,
          }))
        ) || []
    )
  } catch (error) {
    console.error("[v0] Error in generateStaticParams (services):", error)
    return []
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const { model: modelSlug } = await searchParams
  const supabase = createClient()

  const { data: service } = await supabase
    .from("services")
    .select(`
      id,
      services_translations(
        name,
        description,
        locale
      )
    `)
    .eq("slug", slug)
    .single()

  if (!service) {
    return {
      title: "Service not found | DeviceHelp",
      description: "The requested service could not be found.",
    }
  }

  const translation = service.services_translations?.find((t: any) => t.locale === locale)
  const serviceName = translation?.name || "Service"

  let modelData = null
  if (modelSlug) {
    const { data: model } = await supabase
      .from("models")
      .select(`
        id,
        name,
        slug,
        brands(
          name,
          slug
        )
      `)
      .eq("slug", modelSlug)
      .single()

    if (model) {
      modelData = {
        ...model,
        brands: Array.isArray(model.brands) ? model.brands[0] : model.brands,
      }
    }
  }

  let metadata

  if (modelData) {
    // Model-specific metadata
    const brandName = modelData.brands?.name || ""
    const modelName = modelData.name || ""
    const fullModelName = brandName && modelName ? `${brandName} ${modelName}` : modelName

    metadata = {
      cs: {
        title: `${serviceName} ${fullModelName} Praha 6 | Záruka 6 měsíců | DeviceHelp`,
        description: `Profesionální ${serviceName.toLowerCase()} ${fullModelName} v Praze 6 na Břevnově. Záruka 6 měsíců, oprava 2-3 hodiny. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} ${fullModelName}, ${serviceName} ${brandName} Praha 6, oprava ${modelName} Břevnov, servis ${brandName} Běлоhorská`,
      },
      en: {
        title: `${serviceName} ${fullModelName} Prague 6 | 6 Month Warranty | DeviceHelp`,
        description: `Professional ${serviceName.toLowerCase()} ${fullModelName} in Prague 6 Břevnov. 6 month warranty, 2-3 hours service. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} ${fullModelName}, ${serviceName} ${brandName} Prague 6, ${modelName} repair Břevnov`,
      },
      uk: {
        title: `${serviceName} ${fullModelName} Прага 6 | Гарантія 6 місяців | DeviceHelp`,
        description: `Професійний ${serviceName.toLowerCase()} ${fullModelName} в Празі 6 Бржевнов. Гарантія 6 місяців, ремонт 2-3 години. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} ${fullModelName}, ${serviceName} ${brandName} Прага 6, ремонт ${modelName} Бржевнов`,
      },
    }
  } else {
    // Universal service metadata (no specific model)
    metadata = {
      cs: {
        title: `${serviceName} Praha 6 Břevnov | Záruka 6 měsíců | DeviceHelp`,
        description: `${serviceName} – oprava a servis mobilních telefonů a smartphonů v Praze 6 na Břevnově. iPhone, Samsung, Xiaomi. Záruka 6 měsíců, oprava 2-3 hodiny. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} Praha 6, ${serviceName} Břevnov, ${serviceName} mobil, oprava a servis telefonu Bělohorská, servis mobilu Praha 6`,
      },
      en: {
        title: `${serviceName} Prague 6 Břevnov | 6 Month Warranty | DeviceHelp`,
        description: `${serviceName} – mobile phone & smartphone repair and service in Prague 6 Břevnov. iPhone, Samsung, Xiaomi. 6 month warranty, 2-3 hours service. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} Prague 6, ${serviceName} Břevnov, mobile ${serviceName}, phone repair & service Bělohorská`,
      },
      uk: {
        title: `${serviceName} Прага 6 Бржевнов | Гарантія 6 місяців | DeviceHelp`,
        description: `${serviceName} – ремонт і сервіс мобільних телефонів та смартфонів у Празі 6 Бржевнов. iPhone, Samsung, Xiaomi. Гарантія 6 місяців, ремонт 2-3 години. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} Прага 6, ${serviceName} Бржевнов, ${serviceName} мобільний, ремонт і сервіс телефону Белогорська`,
      },
    }
  }

  const currentMetadata = metadata[locale as keyof typeof metadata] || metadata.en

  return {
    title: currentMetadata.title,
    description: currentMetadata.description,
    keywords: currentMetadata.keywords,
    openGraph: {
      title: currentMetadata.title,
      description: currentMetadata.description,
      type: "website",
      locale: toOGLocale(locale),
      url: `${siteUrl}/${locale}/services/${slug}`,
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/services/${slug}`,
      languages: {
        cs: `${siteUrl}/cs/services/${slug}`,
        en: `${siteUrl}/en/services/${slug}`,
        uk: `${siteUrl}/uk/services/${slug}`,
        "x-default": `${siteUrl}/cs/services/${slug}`,
      },
    },
    twitter: {
      card: "summary",
      title: currentMetadata.title,
      description: currentMetadata.description,
    },
    other: {
      "seznam-wmt": "kEPWnFjKJyWrp9OtNNXIlOe6oNf9vfv4",
    },
  }
}

export default async function ServicePage({ params, searchParams }: Props) {
  const { slug, locale } = await params
  const { model: modelSlug } = await searchParams

  // If a model is provided via query param (old format), 301 redirect to new URL format
  if (modelSlug) {
    permanentRedirect(`/${locale}/services/${slug}/${modelSlug}`)
  }

  const brandsT = await getTranslations({ locale, namespace: "Brands" })
  const supabase = createClient()

  // Fetch brands server-side so the device-selection grid renders in the
  // static HTML (no client spinner→grid swap, which caused layout shift).
  const { data: brandsData } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .order("position")
    .order("name")

  const { data: service } = await supabase
    .from("services")
    .select("id, services_translations(name, locale)")
    .eq("slug", slug)
    .single()

  const translation = service?.services_translations?.find((t: any) => t.locale === locale) || service?.services_translations?.[0]
  const serviceName = translation?.name || slug

  // Crawlable catalog links under the interactive picker. The picker itself is
  // buttons + router.push (invisible to crawlers), so this grid is the only
  // path that passes link equity from this hub down to the brand/series hubs
  // and the top money pages.
  type CatalogModel = {
    id: string
    name: string
    slug: string
    position: number | null
    brand_id: string | null
    series_id: string | null
    price: number | null
  }
  const byCatalogPos = (a: { position?: number | null; name?: string }, b: { position?: number | null; name?: string }) =>
    (a.position ?? 999) - (b.position ?? 999) || String(a.name || "").localeCompare(String(b.name || ""))

  let hubBrands: { name: string; slug: string }[] = []
  let hubSeries: { name: string; slug: string }[] = []
  let topModels: CatalogModel[] = []
  if (service?.id) {
    const { data: svcRows } = await supabase
      .from("model_services")
      .select("price, models!inner(id, name, slug, position, brand_id, series_id)")
      .eq("service_id", service.id)

    const svcModels = (svcRows || [])
      .map((r: any) => {
        const m = Array.isArray(r.models) ? r.models[0] : r.models
        return m && m.slug ? ({ ...m, price: r.price } as CatalogModel) : null
      })
      .filter((m): m is CatalogModel => !!m)
      .sort(byCatalogPos)

    topModels = svcModels.slice(0, 12)

    const brandIds = new Set(svcModels.map((m) => m.brand_id).filter(Boolean))
    hubBrands = (brandsData || [])
      .filter((b: any) => b.slug && brandIds.has(b.id))
      .map((b: any) => ({ name: b.name, slug: String(b.slug).toLowerCase() }))

    const seriesIds = [...new Set(svcModels.map((m) => m.series_id).filter(Boolean))] as string[]
    if (seriesIds.length > 0) {
      const { data: seriesRows } = await supabase
        .from("series")
        .select("id, name, slug, position")
        .in("id", seriesIds)
      hubSeries = (seriesRows || [])
        .filter((s: any) => s.slug)
        .sort(byCatalogPos)
        .map((s: any) => ({ name: s.name, slug: String(s.slug).toLowerCase() }))
    }
  }

  const catalogCopy =
    locale === "en"
      ? { byBrand: "By brand", bySeries: "By series", topModels: "Most requested models", from: "from" }
      : locale === "uk"
        ? { byBrand: "За брендом", bySeries: "За лінійкою", topModels: "Найзатребуваніші моделі", from: "від" }
        : { byBrand: "Podle značky", bySeries: "Podle řady", topModels: "Nejžádanější modely", from: "od" }
  const catalogChipClass =
    "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600"

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

  // If no model is provided, show the device selection guard with updated site-wide layout
  return (
    <div className="flex flex-col min-h-screen">
      <div className="order-1 container px-4 py-8 md:py-16 mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-8 pl-1">
          <Breadcrumb
            items={[
              { label: brandsT("allBrands") || "Всі бренди", href: `/${locale}/brands` },
              { label: serviceName, href: "#" }
            ]}
          />
        </div>

        {/* Clean Header Section */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <ShieldCheck className="w-3 h-3" />
            {brandsT("professionalRepair") || "Professional Repair"}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight text-balance">
            {serviceName}
          </h1>
        </div>

        {/* Device Selection Guard Section */}
        <div className="mt-8">
          <DeviceSelectionWrapper serviceSlug={slug} locale={locale} initialBrands={brandsData || []} />
        </div>

        {/* Crawlable catalog: hubs by brand/series + top models (SSR <a> links,
            unlike the interactive picker above) */}
        {(hubBrands.length > 0 || hubSeries.length > 0 || topModels.length > 0) && (
          <div className="mt-12 space-y-8">
            {hubBrands.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {catalogCopy.byBrand}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {hubBrands.map((b) => (
                    <Link key={b.slug} href={`/${locale}/services/${slug}/brand/${b.slug}`} className={catalogChipClass}>
                      {serviceName} {b.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {hubSeries.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {catalogCopy.bySeries}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {hubSeries.map((s) => (
                    <Link key={s.slug} href={`/${locale}/services/${slug}/series/${s.slug}`} className={catalogChipClass}>
                      {serviceName} {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {topModels.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {catalogCopy.topModels}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {topModels.map((m) => (
                    <Link key={m.id} href={`/${locale}/services/${slug}/${m.slug}`} className={catalogChipClass}>
                      <span>{m.name}</span>
                      {m.price != null && m.price > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {catalogCopy.from} {m.price} Kč
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="order-2 w-full">
        <BrandSeoSections locale={locale} services={seoServices} />
      </div>

      <div className="order-3 container mx-auto px-4 pb-16 pt-8 w-full max-w-6xl">
        <ContactCTABanner locale={locale} />
      </div>
    </div>
  )
}
