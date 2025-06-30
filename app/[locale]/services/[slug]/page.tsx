import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { ServicePageClient } from "./service-page-client"

interface ServicePageProps {
  params: {
    locale: string
    slug: string
  }
}

async function getService(slug: string, locale: string) {
  try {
    const supabase = createClient()

    // Try to find service by slug first, then by ID
    let { data: service, error } = await supabase
      .from("services")
      .select(`
        id,
        slug,
        icon,
        position,
        services_translations!inner(
          name,
          description,
          locale
        )
      `)
      .eq("services_translations.locale", locale)
      .eq("slug", slug)
      .single()

    if (!service) {
      const { data, error: idError } = await supabase
        .from("services")
        .select(`
          id,
          slug,
          icon,
          position,
          services_translations!inner(
            name,
            description,
            locale
          )
        `)
        .eq("services_translations.locale", locale)
        .eq("id", slug)
        .single()

      service = data
      error = idError
    }

    if (error || !service) {
      return null
    }

    // Get models that support this service
    const { data: modelServices } = await supabase
      .from("model_services")
      .select(`
        id,
        price,
        models(
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
        )
      `)
      .eq("service_id", service.id)
      .order("price", { ascending: true })

    // Calculate stats
    const prices = modelServices?.map((ms) => ms.price).filter((p) => p !== null) || []
    const stats = {
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      modelsCount: modelServices?.length || 0,
    }

    return {
      ...service,
      models: modelServices || [],
      stats,
    }
  } catch (error) {
    console.error("Error fetching service:", error)
    return null
  }
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const service = await getService(params.slug, params.locale)

  if (!service) {
    return {
      title: "Service Not Found",
    }
  }

  const serviceName = service.services_translations[0]?.name || ""
  const serviceDescription = service.services_translations[0]?.description || ""

  return {
    title: `${serviceName} | DeviceHelp`,
    description: serviceDescription,
    openGraph: {
      title: serviceName,
      description: serviceDescription,
      type: "website",
    },
  }
}

export default async function ServicePage({ params }: ServicePageProps) {
  const service = await getService(params.slug, params.locale)

  if (!service) {
    notFound()
  }

  const t = await getTranslations("Services")

  return (
    <ServicePageClient
      service={service}
      locale={params.locale}
      translations={{
        title: t("title"),
        description: t("description"),
        price: t("price"),
        models: t("models"),
        process: t("process"),
        contact: t("contact"),
        selectModel: t("selectModel"),
        from: t("from"),
        to: t("to"),
        average: t("average"),
        availableFor: t("availableFor"),
        devicesSupported: t("devicesSupported"),
        requestService: t("requestService"),
        viewAllModels: t("viewAllModels"),
        serviceProcess: t("serviceProcess"),
        whyChooseUs: t("whyChooseUs"),
        qualityGuarantee: t("qualityGuarantee"),
        fastService: t("fastService"),
        expertTechnicians: t("expertTechnicians"),
      }}
    />
  )
}
