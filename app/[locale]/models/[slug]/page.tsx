import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { unstable_cache } from "next/cache"
import { createClient } from "@/utils/supabase/client"
import ModelPageClient, { ModelData } from "./model-page-client"
import { getPriceWithDiscount } from "@/lib/discounts/get-applicable-discounts"
import { toOGLocale } from "@/lib/og-locale"
import { siteUrl } from "@/lib/site-config"
import { formatBrandModelName, seoModelName, shortModelTitle } from "@/lib/seo/page-utils"
import { generateBreadcrumbListSchema } from "@/lib/structured-data"
import { PrevNextNav } from "@/components/prev-next-nav"
import { RelatedArticlesList } from "@/components/articles/related-articles-list"
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

// Pre-render popular models at build time
export async function generateStaticParams() {
  // Use public client for build-time static generation
  const supabase = createClient()

  try {
    const { data: models } = await supabase
      .from("models")
      .select("slug")
      .order("position", { ascending: true })
      .limit(100) // Pre-render top 100 models

    const locales = ["uk", "cs", "en"]

    return (
      models
        ?.filter((model) => typeof model.slug === 'string' && model.slug.trim() !== '')
        .flatMap((model) =>
          locales.map((locale) => ({
            locale,
            slug: model.slug,
          }))
        ) || []
    )
  } catch (error) {
    console.error("[v0] Error in generateStaticParams (models):", error)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const supabase = createClient()

  const { data: model } = await supabase
    .from("models")
    .select(`
      id,
      name,
      brands(
        name
      )
    `)
    .eq("slug", slug)
    .single()

  if (!model) {
    return {
      title: "Model not found | DeviceHelp",
      description: "The requested model could not be found.",
    }
  }

  const brandObj = Array.isArray(model.brands) ? model.brands[0] : model.brands
  const brandName = brandObj?.name || "Device"
  const modelName = model.name
  // Search-friendly name (drops redundant "Apple"); title also trims long
  // generation parentheticals so it doesn't get clipped in the SERP.
  const fullModelName = seoModelName(brandName, modelName)
  const titleName = shortModelTitle(fullModelName)

  // Language-specific optimized metadata
  const metadata = {
    cs: {
      title: `Oprava a servis ${titleName} Praha 6 | DeviceHelp`,
      description: `Profesionální oprava a servis ${fullModelName} v Praze 6 na Břevnově. Výměna displeje, baterie, kamery. Záruka 6 měsíců, oprava 2-3 hodiny. Bělohorská 209/133. ☎ +420 775 848 259`,
      keywords: `oprava ${fullModelName} Praha 6, servis ${brandName} Břevnov, výměna displeje ${modelName}, oprava telefonu Bělohorská, servis mobilu Praha6`,
    },
    en: {
      title: `${titleName} Repair Prague 6 | DeviceHelp`,
      description: `Professional ${fullModelName} repair and service in Prague 6 Břevnov. Screen replacement, battery, camera repair. 6 month warranty, 2-3 hours service. Bělohorská 209/133. ☎ +420 775 848 259`,
      keywords: `${fullModelName} repair Prague 6, mobile service Břevnov, screen replacement ${modelName}, phone repair Bělohorská`,
    },
    uk: {
      title: `Ремонт і сервіс ${titleName} | Прага 6 | Гарантія 6 місяців`,
      description: `Професійний ремонт і сервіс ${fullModelName} в Празі 6 Бржевнов. Заміна екрану, батареї, камери. Гарантія 6 місяців, ремонт 2-3 години. Bělohorská 209/133. ☎ +420 775 848 259`,
      keywords: `ремонт ${fullModelName} Прага 6, сервіс мобільних Бржевнов, заміна екрану ${modelName}, ремонт телефону Белогорська`,
    },
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
      url: `${siteUrl}/${locale}/models/${slug}`,
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/models/${slug}`,
      languages: {
        cs: `${siteUrl}/cs/models/${slug}`,
        en: `${siteUrl}/en/models/${slug}`,
        uk: `${siteUrl}/uk/models/${slug}`,
        "x-default": `${siteUrl}/cs/models/${slug}`,
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


export default async function ModelPage({ params }: Props) {
  const { slug, locale } = await params

  const supabase = createClient()

  try {
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select(`
        id,
        name,
        slug,
        image_url,
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
      .eq("slug", slug)
      .single()

    if (modelError || !model) {
      notFound()
    }

    const seriesObj = Array.isArray(model.series) ? model.series[0] : model.series

    const brandObj = Array.isArray(model.brands) ? model.brands[0] : model.brands
    const brandName = brandObj?.name || "Device"
    const modelName = model.name
    const fullModelName = formatBrandModelName(brandName, modelName)

    console.log(`[MODEL PAGE] Found model: ${model.id} - ${model.name}`)

    // Отримуємо послуги для моделі з правильною логікою пріоритетів
    // Використовуємо unstable_cache з тегом для підтримки revalidateTag
    const getModelServices = unstable_cache(
      async (modelId: string) => {
        const { data } = await supabase
          .from("model_services")
          .select(`
            id,
            price,
            warranty_months,
            duration_hours,
            warranty_period,
            detailed_description,
            what_included,
            benefits,
            part_type,
            services(
              id,
              slug,
              position,
              warranty_months,
              duration_hours,
              image_url,
              services_translations(
                name,
                description,
                locale
              )
            )
          `)
          .eq("model_id", modelId)
          .order("services(position)", { ascending: true })
        return data
      },
      [`model-services-${model.id}`],
      {
        tags: [`model-services`, `model-services-${model.id}`, `model-${slug}`],
        revalidate: 3600,
      }
    )
    const modelServices = await getModelServices(model.id)

    console.log(`[MODEL PAGE] Found ${modelServices?.length || 0} model services`)

    const servicesWithTranslations = await Promise.all(
      (modelServices || []).map(async (ms) => {
        const serviceRaw = ms.services
        const service = Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw
        if (!service) return null

        const translations = service.services_translations as any[]
        const translation = translations?.find((t: any) => t.locale === locale)
        if (!translation) return null

        // ВИПРАВЛЕНО: Використовуємо пріоритетну логіку - model_services має пріоритет над services
        const warrantyMonths =
          ms.warranty_months !== null && ms.warranty_months !== undefined
            ? Number.parseInt(ms.warranty_months.toString())
            : service.warranty_months !== null && service.warranty_months !== undefined
              ? Number.parseInt(service.warranty_months.toString())
              : null

        const durationHours =
          ms.duration_hours !== null && ms.duration_hours !== undefined
            ? Number.parseFloat(ms.duration_hours.toString())
            : service.duration_hours !== null && service.duration_hours !== undefined
              ? Number.parseFloat(service.duration_hours.toString())
              : null

        const price = ms.price !== null && ms.price !== undefined ? Number.parseFloat(ms.price.toString()) : null

        let discountedPrice = null
        let hasDiscount = false
        let discount = null
        let actualDiscountPercentage = null // Added actual discount percentage

        if (price !== null) {
          const discountInfo = await getPriceWithDiscount(service.id, model.id, price)
          if (discountInfo.hasDiscount) {
            discountedPrice = discountInfo.discountedPrice
            hasDiscount = true
            discount = discountInfo.discount
            actualDiscountPercentage = discountInfo.actualDiscountPercentage // Get actual percentage after rounding
          }
        }

        return {
          id: service.id,
          slug: service.slug,
          name: translation.name,
          description: translation.description,
          price: price,
          position: service.position,
          warranty_months: warrantyMonths,
          duration_hours: durationHours,
          warranty_period: ms.warranty_period || "months",
          image_url: service.image_url,
          detailed_description: ms.detailed_description || translation.description,
          what_included: ms.what_included,
          benefits: ms.benefits,
          part_type: ms.part_type || null,
          discounted_price: discountedPrice,
          has_discount: hasDiscount,
          discount: discount,
          actual_discount_percentage: actualDiscountPercentage, // Pass actual percentage to client
        }
      }),
    )

    const filteredServices = servicesWithTranslations.filter(Boolean)

    console.log(`[MODEL PAGE] Final services count: ${filteredServices.length}`)

    const modelData: ModelData = {
      id: model.id,
      name: model.name,
      slug: model.slug,
      image_url: model.image_url,
      brands: brandObj,
      series: seriesObj,
      services: filteredServices as any,
    }

    // Unique page description (model-scope → series → brand cascade, language-primary).
    // Empty table until the owner adds content → falls back to the generic subtitle.
    const descScopeIds = [model.id, seriesObj?.id, brandObj?.id].filter(Boolean) as string[]
    let modelDescription: string | null = null
    let modelBody: string | null = null
    if (descScopeIds.length > 0) {
      const { data: descRows } = await supabase
        .from("catalog_descriptions")
        .select("scope_type, scope_id, locale, description, body")
        .in("scope_type", ["model", "series", "brand"])
        .in("scope_id", descScopeIds)

      const rows = (descRows || []) as CatalogDescriptionRow[]
      const order = [
        { type: "model" as const, id: model.id },
        { type: "series" as const, id: seriesObj?.id },
        { type: "brand" as const, id: brandObj?.id },
      ]
      modelDescription = resolveCatalogField("description", locale, rows, order)
      modelBody = resolveCatalogField("body", locale, rows, order)
    }

    // Build a real AggregateOffer from this model's service prices (varies per model → unique signal)
    const servicePrices = (filteredServices as any[])
      .map((s) => s?.price)
      .filter((p) => typeof p === "number" && !Number.isNaN(p) && p > 0)
    const aggregateOffer = servicePrices.length > 0
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "CZK",
          lowPrice: Math.min(...servicePrices),
          highPrice: Math.max(...servicePrices),
          offerCount: servicePrices.length,
          availability: "https://schema.org/InStock",
        }
      : null

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${siteUrl}/${locale}/models/${slug}#service`,
      name: `${fullModelName} Repair`,
      url: `${siteUrl}/${locale}/models/${slug}`,
      description: locale === "cs"
        ? `Profesionální oprava ${fullModelName} v Praze 6. Výměna displeje, baterie, kamery. Záruka 6 měsíců.`
        : locale === "uk"
          ? `Професійний ремонт ${fullModelName} в Празі 6. Заміна екрану, батареї, камери. Гарантія 6 місяців.`
          : `Professional ${fullModelName} repair in Prague 6. Screen replacement, battery, camera repair. 6 month warranty.`,
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
        geo: {
          "@type": "GeoCoordinates",
          latitude: "50.0982",
          longitude: "14.3917",
        },
        telephone: "+420775848259",
        areaServed: ["Praha 6", "Břevnov", "Dejvice", "Vokovice", "Bělohorská", "Praha6"],
      },
      areaServed: "Praha 6",
      ...(aggregateOffer ? { offers: aggregateOffer } : {}),
    }

    const breadcrumbItems = [
      { name: "DeviceHelp", url: `${siteUrl}/${locale}` },
      { name: "Brands", url: `${siteUrl}/${locale}/brands` },
      ...(brandObj?.slug ? [{ name: brandName, url: `${siteUrl}/${locale}/brands/${String(brandObj.slug).toLowerCase()}` }] : []),
      ...(seriesObj?.slug ? [{ name: seriesObj.name, url: `${siteUrl}/${locale}/series/${seriesObj.slug}` }] : []),
      { name: fullModelName, url: `${siteUrl}/${locale}/models/${slug}` },
    ]
    const breadcrumbSchema = generateBreadcrumbListSchema(breadcrumbItems)

    // Fetch prev/next models in the same brand for navigation
    const { data: siblingModels } = brandObj?.id
      ? await supabase
        .from("models")
        .select("name, slug")
        .eq("brand_id", brandObj.id)
        .order("position", { ascending: true })
      : { data: null }

    const modelIndex = siblingModels?.findIndex((m) => m.slug === slug) ?? -1
    const prevModel = modelIndex > 0 ? siblingModels![modelIndex - 1] : null
    const nextModel = siblingModels && modelIndex >= 0 && modelIndex < siblingModels.length - 1
      ? siblingModels[modelIndex + 1]
      : null

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
        <ModelPageClient modelData={modelData} locale={locale} description={modelDescription} body={modelBody} />
        <div className="container mx-auto px-4 py-8">
          <RelatedArticlesList locale={locale} />
          <PrevNextNav
            prev={prevModel ? { name: prevModel.name, href: `/${locale}/models/${prevModel.slug}` } : null}
            next={nextModel ? { name: nextModel.name, href: `/${locale}/models/${nextModel.slug}` } : null}
            label="Navigate models"
          />
        </div>
      </>
    )
  } catch (error) {
    console.error("[MODEL PAGE] Error:", error)
    notFound()
  }
}
