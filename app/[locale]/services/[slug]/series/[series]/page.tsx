import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Breadcrumb } from "@/components/breadcrumb"
import { ContactCTABanner } from "@/components/contact-cta-banner"
import { toOGLocale } from "@/lib/og-locale"
import { siteUrl } from "@/lib/site-config"
import { formatCurrency } from "@/lib/format-currency"
import { generateBreadcrumbListSchema } from "@/lib/structured-data"
import { resolveScopedField, type ScopeRow } from "@/lib/catalog/scope-text"
import { replaceFaqPlaceholders } from "@/lib/faq-placeholder-replacer"
import { lineupLabel, lowerFirst } from "@/lib/seo/page-utils"
import { BrandHubModels, type HubGroup } from "../../brand/[brand]/brand-hub-models"

export const revalidate = 3600
export const dynamicParams = true

type Props = {
  params: Promise<{ locale: string; slug: string; series: string }>
}

const CITY = { cs: "Praha 6", en: "Prague 6", uk: "Прага 6" } as const

async function load(slug: string, seriesSlug: string, locale: string) {
  const supabase = createClient()

  const { data: service } = await supabase
    .from("services")
    .select(`id, slug, services_translations(name, description, detailed_description, what_included, benefits, locale)`)
    .eq("slug", slug)
    .single()
  if (!service) return null

  // Series slugs are lowercase, but stay case-insensitive for safety (mirrors the brand hub).
  const { data: series } = await supabase
    .from("series")
    .select("id, name, slug, brand_id, brands(id, name, slug, logo_url)")
    .ilike("slug", seriesSlug)
    .single()
  if (!series) return null

  const brand = Array.isArray(series.brands) ? (series.brands as any[])[0] : (series.brands as any)

  const { data: rows } = await supabase
    .from("model_services")
    .select(`price, models!inner(id, name, slug, image_url, position, series_id)`)
    .eq("service_id", service.id)
    .eq("models.series_id", series.id)

  const models = (rows || [])
    .map((r: any) => {
      const m = Array.isArray(r.models) ? r.models[0] : r.models
      if (!m) return null
      return {
        id: m.id,
        name: m.name,
        slug: m.slug,
        image_url: m.image_url,
        position: m.position,
        price: r.price,
      }
    })
    .filter((m): m is NonNullable<typeof m> => !!(m && m.slug))
    .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))

  if (models.length === 0) return null

  const prices = models.map((m: any) => m.price).filter((p: any) => p != null && p > 0)
  const minPrice = prices.length ? Math.min(...prices) : null

  const { data: scopeData } = await supabase
    .from("service_scope_translations")
    .select("service_id, scope_type, scope_id, locale, detailed_description, what_included, benefits")
    .eq("service_id", service.id)
    .eq("scope_type", "series")
    .eq("scope_id", series.id)

  const scopeRows = (scopeData || []) as ScopeRow[]
  const translation =
    service.services_translations?.find((t: any) => t.locale === locale) || service.services_translations?.[0]

  // Series-scope override if present; otherwise the short service description.
  // (Never the base detailed_description — it's a per-model template with tokens.)
  const seriesOverride = resolveScopedField("detailed_description", service.id, locale, scopeRows, [], {
    seriesId: series.id,
  })
  const rawDescription = seriesOverride || translation?.description || ""

  const lineup = lineupLabel(series.name, brand?.name)
  const warrantyLabel = locale === "en" ? "6 months" : locale === "uk" ? "6 місяців" : "6 měsíců"
  const durationLabel = locale === "en" ? "2-3 hours" : locale === "uk" ? "2-3 години" : "2-3 hodiny"
  const description = replaceFaqPlaceholders(rawDescription, {
    brand: lineup,
    model: lineup,
    fullModel: lineup,
    service: translation?.name || "",
    price: minPrice != null ? formatCurrency(minPrice) : "",
    warranty: warrantyLabel,
    warrantyCounted: warrantyLabel,
    duration: durationLabel,
    durationFormatted: durationLabel,
  })
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/ {2,}/g, " ")
    .trim()

  return { service, series, brand, lineup, translation, models, minPrice, description }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, series: seriesSlug, locale } = await params
  const data = await load(slug, seriesSlug, locale)
  if (!data) return { title: "Not found | DeviceHelp" }

  const serviceName = data.translation?.name || "Service"
  const { lineup } = data
  const city = CITY[locale as keyof typeof CITY] || CITY.cs
  const from =
    data.minPrice != null
      ? locale === "en"
        ? ` from ${formatCurrency(data.minPrice)}.`
        : locale === "uk"
          ? ` від ${formatCurrency(data.minPrice)}.`
          : ` od ${formatCurrency(data.minPrice)}.`
      : ""

  // Pull "oprava/servis" intent into the title+description so the hub also ranks
  // for "oprava <lineup>" / "servis <lineup>", not just the literal service name.
  const repairWord = locale === "en" ? "repair & service" : locale === "uk" ? "ремонт і сервіс" : "oprava a servis"
  const title = `${serviceName} ${lineup} – ${repairWord} ${city} | DeviceHelp`
  const description =
    locale === "en"
      ? `Professional ${lowerFirst(serviceName)}, repair & service for all ${lineup} models in ${city} Břevnov.${from} 6 month warranty, 2-3 hours. Bělohorská 209/133.`
      : locale === "uk"
        ? `${serviceName} ${lineup} — ремонт і сервіс усіх моделей у Празі 6, Бржевнов.${from} Гарантія 6 місяців, 2-3 години. Bělohorská 209/133.`
        : `Profesionální ${lowerFirst(serviceName)}, oprava a servis všech modelů ${lineup} v Praze 6 na Břevnově.${from} Záruka 6 měsíců, 2-3 hodiny. Bělohorská 209/133.`

  const ss = seriesSlug.toLowerCase()
  const url = `${siteUrl}/${locale}/services/${slug}/series/${ss}`
  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: toOGLocale(locale), url },
    alternates: {
      canonical: url,
      languages: {
        cs: `${siteUrl}/cs/services/${slug}/series/${ss}`,
        en: `${siteUrl}/en/services/${slug}/series/${ss}`,
        uk: `${siteUrl}/uk/services/${slug}/series/${ss}`,
        "x-default": `${siteUrl}/cs/services/${slug}/series/${ss}`,
      },
    },
    other: { "seznam-wmt": "kEPWnFjKJyWrp9OtNNXIlOe6oNf9vfv4" },
  }
}

export default async function ServiceSeriesHubPage({ params }: Props) {
  const { slug, series: seriesSlug, locale } = await params
  const data = await load(slug, seriesSlug, locale)
  if (!data) notFound()

  const { service, series, brand, lineup, translation, models, minPrice, description } = data
  const serviceName = translation?.name || "Service"
  const city = CITY[locale as keyof typeof CITY] || CITY.cs
  const heading = `${serviceName} ${lineup} ${city}`

  const labels =
    locale === "en"
      ? {
          allBrands: "All brands",
          chooseModel: "Choose your model",
          from: "from",
          otherModels: "Other models",
          allSeries: "All series",
          searchPlaceholder: "Search model…",
          noResults: "No models found",
          allModels: `All ${lineup} models & repairs`,
          allDevices: `${serviceName} — all devices`,
        }
      : locale === "uk"
        ? {
            allBrands: "Всі бренди",
            chooseModel: "Оберіть свою модель",
            from: "від",
            otherModels: "Інші моделі",
            allSeries: "Усі серії",
            searchPlaceholder: "Пошук моделі…",
            noResults: "Моделі не знайдено",
            allModels: `Усі моделі та ремонт ${lineup}`,
            allDevices: `${serviceName} — усі пристрої`,
          }
        : {
            allBrands: "Všechny značky",
            chooseModel: "Vyberte svůj model",
            from: "od",
            otherModels: "Ostatní modely",
            allSeries: "Všechny série",
            searchPlaceholder: "Hledat model…",
            noResults: "Žádné modely nenalezeny",
            allModels: `Všechny modely a opravy ${lineup}`,
            allDevices: `${serviceName} — všechna zařízení`,
          }

  // Single group (one series) → BrandHubModels renders a flat grid with search, no chips.
  const modelGroups: HubGroup[] = [{ name: lineup, slug: series.slug ?? null, models }]

  const breadcrumbItems = [
    { name: "DeviceHelp", url: `${siteUrl}/${locale}` },
    { name: labels.allBrands, url: `${siteUrl}/${locale}/brands` },
    ...(brand?.slug
      ? [{ name: brand.name, url: `${siteUrl}/${locale}/brands/${String(brand.slug).toLowerCase()}` }]
      : []),
    { name: series.name, url: `${siteUrl}/${locale}/series/${series.slug}` },
    { name: heading, url: `${siteUrl}/${locale}/services/${slug}/series/${series.slug}` },
  ]
  const breadcrumbSchema = generateBreadcrumbListSchema(breadcrumbItems)

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${siteUrl}/${locale}/services/${slug}/series/${series.slug}#service`,
    name: `${serviceName} ${lineup}`,
    description,
    url: `${siteUrl}/${locale}/services/${slug}/series/${series.slug}`,
    provider: {
      "@type": "LocalBusiness",
      "@id": `${siteUrl}/#business`,
      name: "DeviceHelp",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Bělohorská 209/133",
        addressLocality: "Praha 6-Břevnov",
        addressRegion: "Praha",
        postalCode: "169 00",
        addressCountry: "CZ",
      },
      telephone: "+420 775 848 259",
    },
    areaServed: ["Praha 6", "Břevnov", "Dejvice", "Vokovice"],
    warranty: "6 months",
    ...(minPrice != null
      ? {
          offers: {
            "@type": "AggregateOffer",
            lowPrice: Number(minPrice),
            priceCurrency: "CZK",
            offerCount: models.length,
          },
        }
      : {}),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="container px-4 py-12 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <Breadcrumb
              items={[
                { label: labels.allBrands, href: `/${locale}/brands` },
                ...(brand?.slug
                  ? [{ label: brand.name, href: `/${locale}/brands/${String(brand.slug).toLowerCase()}` }]
                  : []),
                { label: series.name, href: `/${locale}/series/${series.slug}` },
                { label: serviceName, href: "#" },
              ]}
            />
          </div>

          {/* Hero */}
          <div className="mb-12 rounded-xl bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              {brand?.logo_url && (
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-50 p-3">
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-contain"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>
              )}
              <div>
                <h1 className="text-center text-3xl font-bold tracking-tight md:text-left md:text-4xl">{heading}</h1>
                {description && (
                  <p className="mt-3 max-w-[900px] text-center text-muted-foreground md:text-left">{description}</p>
                )}
                {minPrice != null && (
                  <p className="mt-3 text-center text-lg font-semibold text-primary md:text-left">
                    {labels.from} {formatCurrency(minPrice)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Models grid with quick search (single series → no chips) */}
          <BrandHubModels groups={modelGroups} locale={locale} slug={slug} labels={labels} />

          {/* Up-links to the lineup hub (all models/services) and the generic service hub */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-center">
            <Link href={`/${locale}/series/${series.slug}`} className="text-primary hover:underline">
              {labels.allModels}
            </Link>
            <Link href={`/${locale}/services/${slug}`} className="text-primary hover:underline">
              {labels.allDevices}
            </Link>
          </div>

          <div className="mt-16">
            <ContactCTABanner locale={locale} />
          </div>
        </div>
      </div>
    </>
  )
}
