import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { unstable_cache } from "next/cache"
import { createClient } from "@/utils/supabase/client"
import ServicePageClient from "../service-page-client"
import { getPriceWithDiscount } from "@/lib/discounts/get-applicable-discounts"
import { RelatedArticlesList } from "@/components/articles/related-articles-list"
import { toOGLocale } from "@/lib/og-locale"
import { siteUrl } from "@/lib/site-config"
import { formatBrandModelName, seoModelName } from "@/lib/seo/page-utils"
import { asSeoLocale, buildAlsoSearched, buildSynonymFaqs } from "@/lib/seo/service-synonyms"
import { formatCurrency } from "@/lib/format-currency"
import { generateBreadcrumbListSchema } from "@/lib/structured-data"
import { PrevNextNav } from "@/components/prev-next-nav"
import { resolveScopedField, type ScopeRow, type BaseTranslation } from "@/lib/catalog/scope-text"
import { resolveScopedFaqs, type ScopeFaqEntry } from "@/lib/catalog/scope-faqs"
import { NearbyModelLinks } from "./nearby-models"

// ISR Configuration
export const revalidate = 3600 // Regenerate every 1 hour
export const dynamicParams = true // Allow new slugs on-the-fly

type Props = {
  params: Promise<{
    locale: string
    slug: string
    model: string
  }>
}

// Pre-render popular service+model combinations
export async function generateStaticParams() {
  const supabase = createClient()

  try {
    // Get top 20 models
    const { data: models } = await supabase
      .from("models")
      .select("id, slug")
      .order("position", { ascending: true })
      .limit(20)

    if (!models || models.length === 0) return []

    // Get top 10 services
    const { data: services } = await supabase
      .from("services")
      .select("id, slug")
      .order("position", { ascending: true })
      .limit(10)

    if (!services || services.length === 0) return []

    const locales = ["uk", "cs", "en"]
    const params = []

    for (const model of models) {
      // Get services mapped to this model
      const { data: modelServices } = await supabase
        .from("model_services")
        .select("service_id")
        .eq("model_id", model.id)
        .in(
          "service_id",
          services.map((s) => s.id)
        )

      if (!modelServices) continue

      const validServiceIds = modelServices.map((ms) => ms.service_id)
      const validServices = services.filter((s) => validServiceIds.includes(s.id))

      for (const service of validServices) {
        if (!service.slug || !model.slug) continue

        for (const locale of locales) {
          params.push({
            locale,
            slug: service.slug,
            model: model.slug,
          })
        }
      }
    }

    return params
  } catch (error) {
    console.error("[v0] Error in generateStaticParams (service+model):", error)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale, model: modelSlug } = await params
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
        brands: Array.isArray(model.brands) ? model.brands[0] : model.brands
      }
    }
  }

  let metadata

  if (modelData) {
    // Model-specific metadata
    const brandName = modelData.brands?.name || ""
    const modelName = modelData.name || ""
    const fullModelName = formatBrandModelName(brandName, modelName)

    metadata = {
      cs: {
        title: `${serviceName} ${fullModelName} Praha 6 | DeviceHelp`,
        description: `Profesionální ${serviceName.toLowerCase()} ${fullModelName} v Praze 6 na Břevnově. Záruka 6 měsíců, oprava 2-3 hodiny. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} ${fullModelName}, ${serviceName} ${brandName} Praha 6, oprava ${modelName} Břevnov, servis ${brandName} Bělohorská`,
      },
      en: {
        title: `${serviceName} ${fullModelName} Prague 6 | DeviceHelp`,
        description: `Professional ${serviceName.toLowerCase()} ${fullModelName} in Prague 6 Břevnov. 6 month warranty, 2-3 hours service. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} ${fullModelName}, ${serviceName} ${brandName} Prague 6, ${modelName} repair Břevnov`,
      },
      uk: {
        title: `${serviceName} ${fullModelName} | Прага 6`,
        description: `Професійний ${serviceName.toLowerCase()} ${fullModelName} в Празі 6 Бржевнов. Гарантія 6 місяців, ремонт 2-3 години. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} ${fullModelName}, ${serviceName} ${brandName} Прага 6, ремонт ${modelName} Бржевнов`,
      },
    }
  } else {
    // Universal service metadata (no specific model)
    metadata = {
      cs: {
        title: `${serviceName} | Praha 6 Břevnov | DeviceHelp`,
        description: `${serviceName} mobilních telefonů v Praze 6 na Břevnově. Záruka 6 měsíců, oprava 2-3 hodiny. iPhone, Samsung, Xiaomi. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} Praha 6, ${serviceName} Břevnov, ${serviceName} mobil, oprava telefonu Bělohorská, servis Praha6`,
      },
      en: {
        title: `${serviceName} | Prague 6 Břevnov | DeviceHelp`,
        description: `${serviceName} for mobile phones in Prague 6 Břevnov. 6 month warranty, 2-3 hours service. iPhone, Samsung, Xiaomi. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} Prague 6, ${serviceName} Břevnov, mobile ${serviceName}, phone repair Bělohorská`,
      },
      uk: {
        title: `${serviceName} | Прага 6 Бржевнов | DeviceHelp`,
        description: `${serviceName} мобільних телефонів в Празі 6 Бржевнов. Гарантія 6 місяців, ремонт 2-3 години. iPhone, Samsung, Xiaomi. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} Прага 6, ${serviceName} Бржевнов, ${serviceName} мобільний, ремонт телефону Белогорська`,
      },
    }
  }

  const currentMetadata = metadata[locale as keyof typeof metadata] || metadata.en

  const structuredData = modelData
    ? {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `${serviceName} ${modelData.brands?.name || ""} ${modelData.name || ""}`,
      provider: {
        "@type": "LocalBusiness",
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
    }
    : {
      "@context": "https://schema.org",
      "@type": "Service",
      name: serviceName,
      provider: {
        "@type": "LocalBusiness",
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
    }

  return {
    title: currentMetadata.title,
    description: currentMetadata.description,
    keywords: currentMetadata.keywords,
    openGraph: {
      title: currentMetadata.title,
      description: currentMetadata.description,
      type: "website",
      locale: toOGLocale(locale),
      url: `${siteUrl}/${locale}/services/${slug}/${modelSlug}`,
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/services/${slug}/${modelSlug}`,
      languages: {
        cs: `${siteUrl}/cs/services/${slug}/${modelSlug}`,
        en: `${siteUrl}/en/services/${slug}/${modelSlug}`,
        uk: `${siteUrl}/uk/services/${slug}/${modelSlug}`,
        "x-default": `${siteUrl}/cs/services/${slug}/${modelSlug}`,
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

export default async function ServicePageWithModel({ params }: Props) {
  const { slug, locale, model: modelSlug } = await params

  const supabase = createClient()

  try {
    // Get service data
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select(`
        id,
        position,
        warranty_months,
        duration_hours,
        image_url,
        slug,
        services_translations(
          name,
          description,
          detailed_description,
          what_included,
          benefits,
          locale
        )
      `)
      .eq("slug", slug)
      .single()

    if (serviceError || !service) {
      notFound()
    }

    const translation = service.services_translations?.find((t: any) => t.locale === locale)
      || service.services_translations?.[0]
    if (!translation) {
      notFound()
    }

    // Get FAQs
    const { data: faqs } = await supabase
      .from("service_faqs")
      .select(`
        id,
        position,
        service_faq_translations(
          question,
          answer,
          locale
        )
      `)
      .eq("service_id", service.id)
      .order("position")

    // Get source model if specified
    let sourceModel = null
    let modelServicePrice = null
    let modelWarrantyMonths = null
    let modelDurationHours = null
    let discountedPrice = null
    let hasDiscount = false
    let discount = null

    if (modelSlug) {
      const { data: model } = await supabase
        .from("models")
        .select(`
          id,
          name,
          slug,
          image_url,
          position,
          brands(
            id,
            name,
            slug,
            logo_url
          ),
          series(
            id,
            name,
            slug
          )
        `)
        .eq("slug", modelSlug)
        .single()

      if (model) {
        // Витягуємо тільки потрібні поля для серіалізації
        const brandObj = Array.isArray(model.brands) ? model.brands[0] : model.brands
        const seriesObj = Array.isArray(model.series) ? model.series[0] : model.series

        sourceModel = {
          id: model.id,
          name: model.name,
          slug: model.slug,
          image_url: model.image_url,
          position: model.position ?? null,
          brands: brandObj ? {
            id: brandObj.id,
            name: brandObj.name,
            slug: brandObj.slug,
            logo_url: brandObj.logo_url,
          } : null,
          series: seriesObj ? {
            id: seriesObj.id,
            name: seriesObj.name,
            slug: seriesObj.slug,
          } : null,
        }

        // Get model-specific service data — cached with tag for revalidation
        const getModelService = unstable_cache(
          async (modelId: string, serviceId: string) => {
            const { data } = await supabase
              .from("model_services")
              .select(`price, warranty_months, duration_hours`)
              .eq("model_id", modelId)
              .eq("service_id", serviceId)
              .single()
            return data
          },
          [`model-service-${model.id}-${service.id}`],
          {
            tags: [`model-services`, `model-services-${model.id}`, `model-${modelSlug}`],
            revalidate: 3600,
          }
        )
        const modelService = await getModelService(model.id, service.id)

        if (modelService) {
          modelServicePrice = modelService.price
          modelWarrantyMonths = modelService.warranty_months
          modelDurationHours = modelService.duration_hours

          if (modelServicePrice !== null) {
            const discountInfo = await getPriceWithDiscount(service.id, model.id, modelServicePrice)
            if (discountInfo.hasDiscount) {
              discountedPrice = discountInfo.discountedPrice
              hasDiscount = true
              discount = discountInfo.discount
            }
          }
        }
      } else {
        notFound()
      }
    }

    // Get price range for this service across all models
    const { data: priceRange } = await supabase
      .from("model_services")
      .select("price")
      .eq("service_id", service.id)
      .not("price", "is", null)

    let minPrice = null
    let maxPrice = null

    if (priceRange && priceRange.length > 0) {
      const prices = priceRange.map((p) => p.price).filter(Boolean)
      if (prices.length > 0) {
        minPrice = Math.min(...prices)
        maxPrice = Math.max(...prices)
      }
    }

    // Scope- and language-aware description overrides (model > series > brand > base service).
    // Language stays primary; falls back CS -> EN -> UK. See lib/catalog/scope-text.ts.
    const scopeIds = {
      modelId: sourceModel?.id ?? null,
      seriesId: sourceModel?.series?.id ?? null,
      brandId: sourceModel?.brands?.id ?? null,
    }
    const scopeLookupIds = [scopeIds.modelId, scopeIds.seriesId, scopeIds.brandId].filter(Boolean) as string[]
    let scopeRows: ScopeRow[] = []
    if (scopeLookupIds.length > 0) {
      const { data: scopeData } = await supabase
        .from("service_scope_translations")
        .select("service_id, scope_type, scope_id, locale, detailed_description, what_included, benefits")
        .eq("service_id", service.id)
        .in("scope_id", scopeLookupIds)
      scopeRows = (scopeData || []) as ScopeRow[]
    }
    const baseTranslations = (service.services_translations || []) as BaseTranslation[]
    const resolvedDetailed = resolveScopedField("detailed_description", service.id, locale, scopeRows, baseTranslations, scopeIds)
    const resolvedIncluded = resolveScopedField("what_included", service.id, locale, scopeRows, baseTranslations, scopeIds)
    const resolvedBenefits = resolveScopedField("benefits", service.id, locale, scopeRows, baseTranslations, scopeIds)

    // Scope-aware FAQ cascade: the most specific scope that has FAQs wins as a
    // whole list — model FAQs > series FAQs > base service_faqs. See lib/catalog/scope-faqs.ts.
    const modelFaqEntries: ScopeFaqEntry[] = []
    const seriesFaqEntries: ScopeFaqEntry[] = []
    const faqScopeIds = [scopeIds.modelId, scopeIds.seriesId].filter(Boolean) as string[]
    if (faqScopeIds.length > 0) {
      const { data: scopeFaqRows } = await supabase
        .from("service_scope_faqs")
        .select("scope_type, scope_id, position, service_scope_faq_translations(locale, question, answer)")
        .eq("service_id", service.id)
        .in("scope_id", faqScopeIds)
      for (const f of (scopeFaqRows || []) as any[]) {
        const entry: ScopeFaqEntry = { position: f.position, translations: f.service_scope_faq_translations || [] }
        if (f.scope_type === "model" && f.scope_id === scopeIds.modelId) modelFaqEntries.push(entry)
        else if (f.scope_type === "series" && f.scope_id === scopeIds.seriesId) seriesFaqEntries.push(entry)
      }
    }
    const baseFaqEntries: ScopeFaqEntry[] = (faqs || []).map((f: any) => ({
      position: f.position,
      translations: f.service_faq_translations || [],
    }))
    const resolvedFaqs = resolveScopedFaqs(locale, [modelFaqEntries, seriesFaqEntries, baseFaqEntries])

    // Long-tail SEO: clean model name, a crawlable "people also search" line and a
    // price/duration FAQ injected so the page ranks beyond the literal service name
    // (oprava/výměna, obrazovka/LCD/sklo, cena/kolik stojí, symptom queries) in cs/uk/en.
    const seoLoc = asSeoLocale(locale)
    const seoModel = seoModelName(sourceModel?.brands?.name, sourceModel?.name)
    const priceForSeo = modelServicePrice ?? minPrice
    const priceLabel = priceForSeo != null ? formatCurrency(Number(priceForSeo)) : null
    const alsoSearched = buildAlsoSearched(slug, seoLoc, seoModel)
    const synonymFaqs = buildSynonymFaqs(seoLoc, translation.name || "", seoModel, priceLabel)

    const serviceData = {
      id: service.id,
      position: service.position || 0,
      warranty_months:
        modelWarrantyMonths !== null && modelWarrantyMonths !== undefined
          ? modelWarrantyMonths
          : (service.warranty_months || null),
      duration_hours:
        modelDurationHours !== null && modelDurationHours !== undefined ? modelDurationHours : (service.duration_hours || null),
      warranty_period: "months",
      image_url: service.image_url || null,
      slug: service.slug,
      translation: {
        name: translation?.name || "",
        description: translation?.description || "",
        detailed_description: resolvedDetailed || "",
        what_included: resolvedIncluded || "",
        benefits: resolvedBenefits || null,
      },
      faqs: [
        ...resolvedFaqs.map((faq, i) => ({
          id: `faq-${i}`,
          position: i,
          translation: { question: faq.question, answer: faq.answer },
        })),
        // Appended price/duration FAQ — adds "cena/kolik stojí" + "jak dlouho" intent.
        ...synonymFaqs.map((faq, i) => ({
          id: `faq-syn-${i}`,
          position: resolvedFaqs.length + i,
          translation: { question: faq.question, answer: faq.answer },
        })),
      ],
      sourceModel: sourceModel ? {
        id: sourceModel.id || "",
        name: sourceModel.name || "",
        slug: sourceModel.slug || "",
        image_url: sourceModel.image_url || null,
        brands: sourceModel.brands ? {
          id: sourceModel.brands.id || "",
          name: sourceModel.brands.name || "",
          slug: sourceModel.brands.slug || "",
          logo_url: sourceModel.brands.logo_url || null,
        } : null,
        series: sourceModel.series ? {
          id: sourceModel.series.id || "",
          name: sourceModel.series.name || "",
          slug: sourceModel.series.slug || "",
        } : null,
      } : null,
      modelServicePrice: modelServicePrice ? Number(modelServicePrice) : null,
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      discountedPrice: discountedPrice ? Number(discountedPrice) : null,
      hasDiscount: hasDiscount || false,
      discount: discount ? JSON.parse(JSON.stringify(discount)) : null,
      modelSlug: modelSlug || null,
    }


    const fullModelName = formatBrandModelName(sourceModel?.brands?.name, sourceModel?.name)
    const pageDescription = locale === "cs"
      ? `Profesionální ${translation.name.toLowerCase()} ${fullModelName} v Praze 6. Záruka 6 měsíců.`
      : locale === "uk"
        ? `Професійний ${translation.name.toLowerCase()} ${fullModelName} в Празі 6. Гарантія 6 місяців.`
        : `Professional ${translation.name.toLowerCase()} ${fullModelName} in Prague 6. 6-month warranty.`

    const structuredData = sourceModel
      ? {
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": `${siteUrl}/${locale}/services/${slug}/${modelSlug}#service`,
        name: `${translation.name} ${fullModelName}`,
        description: pageDescription,
        url: `${siteUrl}/${locale}/services/${slug}/${modelSlug}`,
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
        ...(modelServicePrice
          ? {
              offers: {
                "@type": "Offer",
                price: Number(modelServicePrice),
                priceCurrency: "CZK",
                url: `${siteUrl}/${locale}/services/${slug}/${modelSlug}`,
                availability: "https://schema.org/InStock",
              },
            }
          : {}),
      }
      : {
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": `${siteUrl}/${locale}/services/${slug}/${modelSlug}#service`,
        name: translation.name,
        description: pageDescription,
        url: `${siteUrl}/${locale}/services/${slug}/${modelSlug}`,
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
      }

    // Fetch prev/next services for this model (navigate between services, not models)
    const { data: modelAllServices } = await supabase
      .from("model_services")
      .select("services(slug, position, services_translations(name, locale))")
      .eq("model_id", sourceModel?.id)
      .order("services(position)", { ascending: true })

    // Build a flat, sorted list of services for this model with localized names
    const sortedServices = (modelAllServices || [])
      .map((ms: any) => Array.isArray(ms.services) ? ms.services[0] : ms.services)
      .filter(Boolean)
      .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999))
      .map((svc: any) => {
        const t = (svc.services_translations as any[])?.find((tr: any) => tr.locale === locale) ?? svc.services_translations?.[0]
        return { name: t?.name ?? svc.slug, slug: svc.slug }
      })

    const servicePageIndex = sortedServices.findIndex((s: any) => s.slug === slug)
    const prevServiceNav = servicePageIndex > 0 ? sortedServices[servicePageIndex - 1] : null
    const nextServiceNav = servicePageIndex >= 0 && servicePageIndex < sortedServices.length - 1
      ? sortedServices[servicePageIndex + 1]
      : null

    const breadcrumbItems = [
      { name: "DeviceHelp", url: `${siteUrl}/${locale}` },
      { name: "Brands", url: `${siteUrl}/${locale}/brands` },
      ...(sourceModel?.brands?.slug
        ? [{ name: sourceModel.brands.name, url: `${siteUrl}/${locale}/brands/${String(sourceModel.brands.slug).toLowerCase()}` }]
        : []),
      ...(sourceModel?.series?.slug
        ? [{ name: sourceModel.series.name, url: `${siteUrl}/${locale}/series/${sourceModel.series.slug}` }]
        : []),
      ...(sourceModel?.slug ? [{ name: fullModelName, url: `${siteUrl}/${locale}/models/${sourceModel.slug}` }] : []),
      { name: translation.name, url: `${siteUrl}/${locale}/services/${slug}/${modelSlug}` },
    ]
    const breadcrumbSchema = generateBreadcrumbListSchema(breadcrumbItems)

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <ServicePageClient serviceData={serviceData} locale={locale} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Up-links: pass equity to the lineup hub, the brand×service hub and
              the generic service hub (money page → series → hubs → service → home). */}
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-center">
            {sourceModel?.series?.slug && (
              <a
                href={`/${locale}/services/${slug}/series/${String(sourceModel.series.slug).toLowerCase()}`}
                className="font-medium text-primary hover:underline"
              >
                {locale === "en"
                  ? `${translation.name} — all ${sourceModel.series.name} models`
                  : locale === "uk"
                    ? `${translation.name} — усі моделі ${sourceModel.series.name}`
                    : `${translation.name} — všechny modely ${sourceModel.series.name}`}
              </a>
            )}
            {sourceModel?.series?.slug && (
              <a href={`/${locale}/series/${sourceModel.series.slug}`} className="text-primary hover:underline">
                {locale === "en"
                  ? `All ${sourceModel.series.name} models`
                  : locale === "uk"
                    ? `Усі моделі ${sourceModel.series.name}`
                    : `Všechny modely ${sourceModel.series.name}`}
              </a>
            )}
            {sourceModel?.brands?.slug && (
              <a
                href={`/${locale}/services/${slug}/brand/${String(sourceModel.brands.slug).toLowerCase()}`}
                className="text-primary hover:underline"
              >
                {locale === "en"
                  ? `All ${sourceModel.brands.name} models — ${translation.name}`
                  : locale === "uk"
                    ? `Усі моделі ${sourceModel.brands.name} — ${translation.name}`
                    : `Všechny modely ${sourceModel.brands.name} — ${translation.name}`}
              </a>
            )}
            <a href={`/${locale}/services/${slug}`} className="text-primary hover:underline">
              {locale === "en"
                ? `${translation.name} — all devices`
                : locale === "uk"
                  ? `${translation.name} — усі пристрої`
                  : `${translation.name} — všechna zařízení`}
            </a>
          </div>
          {alsoSearched && (
            <p className="mt-8 text-center text-sm text-muted-foreground">{alsoSearched}</p>
          )}
          {/* Sideways cluster: the same service on neighboring models */}
          {sourceModel && (
            <NearbyModelLinks
              serviceId={service.id}
              serviceSlug={slug}
              serviceName={translation.name}
              locale={locale}
              modelId={sourceModel.id}
              modelPosition={(sourceModel as any).position ?? null}
              seriesId={sourceModel.series?.id ?? null}
              brandId={sourceModel.brands?.id ?? null}
              scopeName={sourceModel.series?.name || sourceModel.brands?.name || ""}
            />
          )}
          <RelatedArticlesList locale={locale} serviceId={service.id} />
          <PrevNextNav
            prev={prevServiceNav ? { name: prevServiceNav.name, href: `/${locale}/services/${prevServiceNav.slug}/${modelSlug}` } : null}
            next={nextServiceNav ? { name: nextServiceNav.name, href: `/${locale}/services/${nextServiceNav.slug}/${modelSlug}` } : null}
            label="Navigate services"
          />
        </div>
      </>
    )
  } catch (error) {
    console.error("Error loading service page:", error)
    notFound()
  }
}
