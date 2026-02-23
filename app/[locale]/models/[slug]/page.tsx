import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { createClient } from "@/utils/supabase/client"
import ModelPageClient, { ModelData } from "./model-page-client"
import { getPriceWithDiscount } from "@/lib/discounts/get-applicable-discounts"
import { toOGLocale } from "@/lib/og-locale"
import { siteUrl } from "@/lib/site-config"

// ISR Configuration
export const revalidate = 3600 // Regenerate every 1 hour
export const dynamicParams = true // Allow new slugs on-the-fly

type Props = {
  params: {
    locale: string
    slug: string
  }
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

    const locales = ["cs", "uk", "en"]

    return (
      models?.flatMap((model) =>
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
  const supabase = await createServerClient()

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

  // Language-specific optimized metadata
  const metadata = {
    cs: {
      title: `Oprava ${brandName} ${modelName} Praha 6 Břevnov | Servis mobilů | Záruka 6 měsíců`,
      description: `Profesionální oprava ${brandName} ${modelName} v Praze 6 na Břevnově. Výměna displeje, baterie, kamery. Záruka 6 měsíců, oprava 2-3 hodiny. Bělohorská 209/133. ☎ +420 775 848 259`,
      keywords: `oprava ${brandName} ${modelName} Praha 6, servis ${brandName} Břevnov, výměna displeje ${modelName}, oprava telefonu Bělohorská, servis mobilu Praha6`,
    },
    en: {
      title: `${brandName} ${modelName} Repair Prague 6 Břevnov | Mobile Service | 6 Month Warranty`,
      description: `Professional ${brandName} ${modelName} repair in Prague 6 Břevnov. Screen replacement, battery, camera repair. 6 month warranty, 2-3 hours service. Bělohorská 209/133. ☎ +420 775 848 259`,
      keywords: `${brandName} ${modelName} repair Prague 6, mobile service Břevnov, screen replacement ${modelName}, phone repair Bělohorská`,
    },
    uk: {
      title: `Ремонт ${brandName} ${modelName} | Прага 6 | Гарантія 6 місяців`,
      description: `Професійний ремонт ${brandName} ${modelName} в Празі 6 Бржевнов. Заміна екрану, батареї, камери. Гарантія 6 місяців, ремонт 2-3 години. Bělohorská 209/133. ☎ +420 775 848 259`,
      keywords: `ремонт ${brandName} ${modelName} Прага 6, сервіс мобільних Бржевнов, заміна екрану ${modelName}, ремонт телефону Белогорська`,
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

import { RelatedArticlesList } from "@/components/articles/related-articles-list"

export default async function ModelPage({ params }: Props) {
  const { slug, locale } = await params

  const supabase = await createServerClient()

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

    console.log(`[MODEL PAGE] Found model: ${model.id} - ${model.name}`)

    // Отримуємо послуги для моделі з правильною логікою пріоритетів
    const { data: modelServices } = await supabase
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
      .eq("model_id", model.id)
      .order("services(position)", { ascending: true })

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

    const structuredData = {
      "@context": "https://schema.org",
      "@type": ["Service", "LocalBusiness"],
      "@id": "https://devicehelp.cz/#business",
      name: `${brandName} ${modelName} Repair`,
      url: "https://devicehelp.cz",
      description: locale === "cs"
        ? `Profesionální oprava ${brandName} ${modelName} v Praze 6. Výměna displeje, baterie, kamery. Záruka 6 měsíců.`
        : locale === "uk"
          ? `Професійний ремонт ${brandName} ${modelName} в Празі 6. Заміна екрану, батареї, камери. Гарантія 6 місяців.`
          : `Professional ${brandName} ${modelName} repair in Prague 6. Screen replacement, battery, camera repair. 6 month warranty.`,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Bělohorská 209/133",
        addressLocality: "Praha 6-Břevnov",
        addressRegion: "Praha",
        postalCode: "169 00",
        addressCountry: "CZ",
      },
      telephone: "+420775848259",
      provider: {
        "@type": "LocalBusiness",
        "@id": "https://devicehelp.cz/#business",
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
      offers: {
        "@type": "Offer",
        warranty: "6 months",
        priceCurrency: "CZK",
      },
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ModelPageClient modelData={modelData} locale={locale} />
        <div className="container mx-auto px-4 py-8">
          <RelatedArticlesList locale={locale} />
        </div>
      </>
    )
  } catch (error) {
    console.error("[MODEL PAGE] Error:", error)
    notFound()
  }
}
