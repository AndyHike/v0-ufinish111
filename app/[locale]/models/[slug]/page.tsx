import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import ModelPageClient from "./model-page-client"

type Props = {
  params: {
    locale: string
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = params
  const supabase = createServerClient()

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

  const brandName = model.brands?.name || "Device"
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
      title: `Ремонт ${brandName} ${modelName} Прага 6 Бржевнов | Сервіс мобільних | Гарантія 6 місяців`,
      description: `Професійний ремонт ${brandName} ${modelName} в Празі 6 Бржевнов. Заміна екрану, батареї, камери. Гарантія 6 місяців, ремонт 2-3 години. Bělohorská 209/133. ☎ +420 775 848 259`,
      keywords: `ремонт ${brandName} ${modelName} Прага 6, сервіс мобільних Бржевнов, заміна екрану ${modelName}, ремонт телефону Белогорська`,
    },
  }

  const currentMetadata = metadata[locale as keyof typeof metadata] || metadata.en

  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["Service", "LocalBusiness"],
    name: `${brandName} ${modelName} Repair`,
    description: currentMetadata.description,
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
      geo: {
        "@type": "GeoCoordinates",
        latitude: "50.0982",
        longitude: "14.3917",
      },
      telephone: "+420775848259",
      areaServed: ["Praha 6", "Břevnov", "Dejvice", "Vokovice", "Bělohorská", "Praha6"],
    },
    areaServed: "Praha 6",
    serviceType: "Mobile Phone Repair",
    offers: {
      "@type": "Offer",
      warranty: "6 months",
      priceCurrency: "CZK",
    },
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
    },
    twitter: {
      card: "summary",
      title: currentMetadata.title,
      description: currentMetadata.description,
    },
    other: {
      "seznam-wmt": "kEPWnFjKJyWrp9OtNNXIlOe6oNf9vfv4",
      structuredData: structuredData,
    },
  }
}

export default async function ModelPage({ params }: Props) {
  const { slug, locale } = params

  const supabase = createServerClient()

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
      .order("services(position)")

    console.log(`[MODEL PAGE] Found ${modelServices?.length || 0} model services`)

    const servicesWithTranslations =
      modelServices
        ?.map((ms) => {
          const service = ms.services
          if (!service) return null

          const translation = service.services_translations?.find((t: any) => t.locale === locale)
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

          console.log(`[MODEL PAGE] Service ${service.id} data:`, {
            name: translation.name,
            model_service_warranty: ms.warranty_months,
            service_warranty: service.warranty_months,
            final_warranty: warrantyMonths,
            model_service_duration: ms.duration_hours,
            service_duration: service.duration_hours,
            final_duration: durationHours,
            price: price,
            warranty_period: ms.warranty_period || "months",
          })

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
          }
        })
        .filter(Boolean) || []

    console.log(`[MODEL PAGE] Final services count: ${servicesWithTranslations.length}`)

    const modelData = {
      id: model.id,
      name: model.name,
      slug: model.slug,
      image_url: model.image_url,
      brands: model.brands,
      series: model.series,
      services: servicesWithTranslations,
    }

    return <ModelPageClient modelData={modelData} locale={locale} />
  } catch (error) {
    console.error("[MODEL PAGE] Error:", error)
    notFound()
  }
}
