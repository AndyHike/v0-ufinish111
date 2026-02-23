import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import ServicePageClient from "./service-page-client"
import { getPriceWithDiscount } from "@/lib/discounts/get-applicable-discounts"
import { DeviceSelectionWrapper } from "./device-selection-wrapper"

type Props = {
  params: Promise<{
    locale: string
    slug: string
  }>
  searchParams: Promise<{
    model?: string
  }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const { model: modelSlug } = await searchParams
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
      name: `${serviceName} ${modelData.brands?.name} ${modelData.name}`,
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
      url: `https://devicehelp.cz/${locale}/services/${slug}`,
    },
    alternates: {
      canonical: `https://devicehelp.cz/${locale}/services/${slug}`,
    },
    twitter: {
      card: "summary",
      title: currentMetadata.title,
      description: currentMetadata.description,
    },
    other: {
      "seznam-wmt": "kEPWnFjKJyWrp9OtNNXIlOe6oNf9vfv4",
      "structured-data": JSON.stringify(structuredData),
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

  // If no model is provided, show the device selection guard
  return <DeviceSelectionWrapper serviceSlug={slug} locale={locale} />
}
