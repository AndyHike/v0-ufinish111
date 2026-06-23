import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Smartphone } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Breadcrumb } from "@/components/breadcrumb"
import { ContactCTABanner } from "@/components/contact-cta-banner"
import { toOGLocale } from "@/lib/og-locale"
import { siteUrl } from "@/lib/site-config"
import { formatCurrency } from "@/lib/format-currency"
import { generateBreadcrumbListSchema } from "@/lib/structured-data"
import { resolveScopedField, type ScopeRow } from "@/lib/catalog/scope-text"
import { replaceFaqPlaceholders } from "@/lib/faq-placeholder-replacer"

export const revalidate = 3600
export const dynamicParams = true

type Props = {
  params: Promise<{ locale: string; slug: string; brand: string }>
}

const CITY = { cs: "Praha 6", en: "Prague 6", uk: "Прага 6" } as const

async function load(slug: string, brandSlug: string, locale: string) {
  const supabase = createClient()

  const { data: service } = await supabase
    .from("services")
    .select(`id, slug, services_translations(name, description, detailed_description, what_included, benefits, locale)`)
    .eq("slug", slug)
    .single()
  if (!service) return null

  // Case-insensitive: brand slugs are inconsistently cased in the DB
  // (e.g. "Xiaomi"), while internal links lowercase them.
  const { data: brand } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .ilike("slug", brandSlug)
    .single()
  if (!brand) return null

  const { data: rows } = await supabase
    .from("model_services")
    .select(`price, models!inner(id, name, slug, image_url, position, brand_id, series(id, name))`)
    .eq("service_id", service.id)
    .eq("models.brand_id", brand.id)

  const models = (rows || [])
    .map((r: any) => {
      const m = Array.isArray(r.models) ? r.models[0] : r.models
      if (!m) return null
      const seriesRaw = m.series
      const series = Array.isArray(seriesRaw) ? seriesRaw[0] : seriesRaw
      return {
        id: m.id,
        name: m.name,
        slug: m.slug,
        image_url: m.image_url,
        position: m.position,
        price: r.price,
        series: series ? { id: series.id, name: series.name } : null,
      }
    })
    .filter((m: any) => m && m.slug)
    .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999))

  if (models.length === 0) return null

  const prices = models.map((m: any) => m.price).filter((p: any) => p != null && p > 0)
  const minPrice = prices.length ? Math.min(...prices) : null

  const { data: scopeData } = await supabase
    .from("service_scope_translations")
    .select("service_id, scope_type, scope_id, locale, detailed_description, what_included, benefits")
    .eq("service_id", service.id)
    .eq("scope_type", "brand")
    .eq("scope_id", brand.id)

  const scopeRows = (scopeData || []) as ScopeRow[]
  const scopeIds = { brandId: brand.id }
  const translation = service.services_translations?.find((t: any) => t.locale === locale) || service.services_translations?.[0]

  // Use a brand-scope override if present; otherwise the short service description.
  // (Do NOT fall back to the base detailed_description — it's a per-model template
  //  full of {{model}}/{{price}} placeholders that don't fit a brand hub.)
  const brandOverride = resolveScopedField("detailed_description", service.id, locale, scopeRows, [], scopeIds)
  const rawDescription = brandOverride || translation?.description || ""

  const warrantyLabel = locale === "en" ? "6 months" : locale === "uk" ? "6 місяців" : "6 měsíců"
  const durationLabel = locale === "en" ? "2-3 hours" : locale === "uk" ? "2-3 години" : "2-3 hodiny"
  const description = replaceFaqPlaceholders(rawDescription, {
    brand: brand.name,
    model: brand.name,
    fullModel: brand.name,
    service: translation?.name || "",
    price: minPrice != null ? formatCurrency(minPrice) : "",
    warranty: warrantyLabel,
    warrantyCounted: warrantyLabel,
    duration: durationLabel,
    durationFormatted: durationLabel,
  })
    .replace(/\{\{[^}]+\}\}/g, "") // strip any leftover tokens
    .replace(/ {2,}/g, " ")
    .trim()

  return { service, brand, translation, models, minPrice, description }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, brand: brandSlug, locale } = await params
  const data = await load(slug, brandSlug, locale)
  if (!data) return { title: "Not found | DeviceHelp" }

  const serviceName = data.translation?.name || "Service"
  const brandName = data.brand.name
  const city = CITY[locale as keyof typeof CITY] || CITY.cs
  const from =
    data.minPrice != null
      ? locale === "en"
        ? ` from ${formatCurrency(data.minPrice)}.`
        : locale === "uk"
          ? ` від ${formatCurrency(data.minPrice)}.`
          : ` od ${formatCurrency(data.minPrice)}.`
      : ""

  const title = `${serviceName} ${brandName} ${city} | DeviceHelp`
  const description =
    locale === "en"
      ? `${serviceName} for all ${brandName} models in ${city} Břevnov.${from} 6 month warranty, 2-3 hours. Bělohorská 209/133.`
      : locale === "uk"
        ? `${serviceName} для всіх моделей ${brandName} у ${city}, Бржевнов.${from} Гарантія 6 місяців, 2-3 години. Bělohorská 209/133.`
        : `${serviceName} pro všechny modely ${brandName} v ${city} na Břevnově.${from} Záruka 6 měsíců, oprava 2-3 hodiny. Bělohorská 209/133.`

  const bs = brandSlug.toLowerCase()
  const url = `${siteUrl}/${locale}/services/${slug}/brand/${bs}`
  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: toOGLocale(locale), url },
    alternates: {
      canonical: url,
      languages: {
        cs: `${siteUrl}/cs/services/${slug}/brand/${bs}`,
        en: `${siteUrl}/en/services/${slug}/brand/${bs}`,
        uk: `${siteUrl}/uk/services/${slug}/brand/${bs}`,
        "x-default": `${siteUrl}/cs/services/${slug}/brand/${bs}`,
      },
    },
    other: { "seznam-wmt": "kEPWnFjKJyWrp9OtNNXIlOe6oNf9vfv4" },
  }
}

export default async function ServiceBrandHubPage({ params }: Props) {
  const { slug, brand: brandSlug, locale } = await params
  const data = await load(slug, brandSlug, locale)
  if (!data) notFound()

  const { service, brand, translation, models, minPrice, description } = data
  const serviceName = translation?.name || "Service"
  const city = CITY[locale as keyof typeof CITY] || CITY.cs
  const heading = `${serviceName} ${brand.name} ${city}`

  const labels =
    locale === "en"
      ? { allBrands: "All brands", chooseModel: "Choose your model", from: "from", otherModels: "Other models" }
      : locale === "uk"
        ? { allBrands: "Всі бренди", chooseModel: "Оберіть свою модель", from: "від", otherModels: "Інші моделі" }
        : { allBrands: "Všechny značky", chooseModel: "Vyberte svůj model", from: "od", otherModels: "Ostatní modely" }

  // Group models by series so the grid isn't a jumble; order series by the
  // position of their earliest model, models within a series by position.
  const groupsMap = new Map<string, { name: string | null; minPos: number; models: any[] }>()
  for (const m of models as any[]) {
    const key = m.series?.id || "__none__"
    if (!groupsMap.has(key)) groupsMap.set(key, { name: m.series?.name ?? null, minPos: m.position ?? 999, models: [] })
    const g = groupsMap.get(key)!
    g.models.push(m)
    g.minPos = Math.min(g.minPos, m.position ?? 999)
  }
  const modelGroups = Array.from(groupsMap.values()).sort((a, b) => a.minPos - b.minPos)

  const breadcrumbItems = [
    { name: "DeviceHelp", url: `${siteUrl}/${locale}` },
    { name: labels.allBrands, url: `${siteUrl}/${locale}/brands` },
    { name: brand.name, url: `${siteUrl}/${locale}/brands/${String(brand.slug).toLowerCase()}` },
    { name: heading, url: `${siteUrl}/${locale}/services/${slug}/brand/${brandSlug}` },
  ]
  const breadcrumbSchema = generateBreadcrumbListSchema(breadcrumbItems)

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${siteUrl}/${locale}/services/${slug}/brand/${brandSlug}#service`,
    name: `${serviceName} ${brand.name}`,
    description,
    url: `${siteUrl}/${locale}/services/${slug}/brand/${brandSlug}`,
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
                { label: brand.name, href: `/${locale}/brands/${String(brand.slug).toLowerCase()}` },
                { label: serviceName, href: "#" },
              ]}
            />
          </div>

          {/* Hero */}
          <div className="mb-12 rounded-xl bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              {brand.logo_url && (
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-50 p-3">
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-contain"
                    quality={80}
                    priority
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

          {/* Models, grouped by series for a less-jumbled layout */}
          <div>
            <h2 className="mb-8 border-b pb-2 text-2xl font-bold">{labels.chooseModel}</h2>
            <div className="space-y-10">
              {modelGroups.map((group, gi) => (
                <div key={gi}>
                  <h3 className="mb-4 text-lg font-semibold text-muted-foreground">{group.name || labels.otherModels}</h3>
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {group.models.map((model: any) => (
                      <Link
                        key={model.id}
                        href={`/${locale}/services/${slug}/${model.slug}`}
                        className="group flex flex-col items-center rounded-lg bg-white p-4 shadow-sm hover:shadow"
                      >
                        <div
                          className={`relative mb-4 flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-28 sm:w-28 ${
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
                              sizes="(max-width: 640px) 96px, 112px"
                            />
                          ) : (
                            <Smartphone className="h-8 w-8 text-slate-400" />
                          )}
                        </div>
                        <h4 className="text-center text-base font-medium group-hover:text-primary sm:text-lg">
                          {model.name}
                        </h4>
                        {model.price != null && model.price > 0 && (
                          <span className="mt-1 text-sm text-muted-foreground">
                            {labels.from} {formatCurrency(model.price)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16">
            <ContactCTABanner locale={locale} />
          </div>
        </div>
      </div>
    </>
  )
}
