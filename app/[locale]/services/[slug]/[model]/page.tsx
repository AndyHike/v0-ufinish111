import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import ServicePageClient from "../service-page-client"
import { getPriceWithDiscount } from "@/lib/discounts/get-applicable-discounts"

type Props = {
  params: Promise<{
    locale: string
    slug: string
    model: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale, model: modelSlug } = await params
  const supabase = await createServerClient()

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
      modelData = model
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
        keywords: `${serviceName} ${fullModelName}, ${serviceName} ${brandName} Praha 6, oprava ${modelName} Břevnov, servis ${brandName} Bělohorská`,
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
        description: `${serviceName} mobilních telefonů v Praze 6 na Břevnově. Záruka 6 měsíců, oprava 2-3 hodiny. iPhone, Samsung, Xiaomi. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} Praha 6, ${serviceName} Břevnov, ${serviceName} mobil, oprava telefonu Bělohorská, servis Praha6`,
      },
      en: {
        title: `${serviceName} Prague 6 Břevnov | 6 Month Warranty | DeviceHelp`,
        description: `${serviceName} for mobile phones in Prague 6 Břevnov. 6 month warranty, 2-3 hours service. iPhone, Samsung, Xiaomi. Bělohorská 209/133. ☎ +420 775 848 259`,
        keywords: `${serviceName} Prague 6, ${serviceName} Břevnov, mobile ${serviceName}, phone repair Bělohorská`,
      },
      uk: {
        title: `${serviceName} Прага 6 Бржевнов | Гарантія 6 місяців | DeviceHelp`,
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
      locale: locale,
      url: `https://devicehelp.cz/${locale}/services/${slug}/${model}`,
    },
    alternates: {
      canonical: `https://devicehelp.cz/${locale}/services/${slug}/${model}`,
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

  const supabase = await createServerClient()

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

    const faqsWithTranslations =
      faqs
        ?.map((faq: any) => ({
          id: faq.id,
          position: faq.position,
          translation: {
            question: faq.service_faq_translations?.find((t: any) => t.locale === locale)?.question || "",
            answer: faq.service_faq_translations?.find((t: any) => t.locale === locale)?.answer || "",
          },
        }))
        .filter((faq: any) => faq.translation.question && faq.translation.answer) || []

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
          brands(
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq("slug", modelSlug)
        .single()

      if (model) {
        // Витягуємо тільки потрібні поля для серіалізації
        sourceModel = {
          id: model.id,
          name: model.name,
          slug: model.slug,
          image_url: model.image_url,
          brands: model.brands ? {
            id: model.brands.id,
            name: model.brands.name,
            slug: model.brands.slug,
            logo_url: model.brands.logo_url,
          } : null,
        }

        // Get model-specific service data
        const { data: modelService } = await supabase
          .from("model_services")
          .select(`
            price,
            warranty_months,
            duration_hours
          `)
          .eq("model_id", model.id)
          .eq("service_id", service.id)
          .single()

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
        detailed_description: translation?.detailed_description || "",
        what_included: translation?.what_included ? (typeof translation.what_included === "string" ? translation.what_included : "") : "",
        benefits: translation?.benefits || null,
      },
      faqs: faqsWithTranslations.map((faq: any) => ({
        id: faq.id || "",
        position: faq.position || 0,
        translation: {
          question: faq.translation?.question || "",
          answer: faq.translation?.answer || "",
        },
      })),
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
      } : null,
      modelServicePrice: modelServicePrice || null,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      discountedPrice: discountedPrice || null,
      hasDiscount: hasDiscount || false,
      discount: discount || null,
      modelSlug: modelSlug || null,
    }


    return <ServicePageClient serviceData={serviceData} locale={locale} />
  } catch (error) {
    console.error("Error loading service page:", error)
    notFound()
  }
}
