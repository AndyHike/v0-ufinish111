import { createServerClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import ServicePageClient from "./service-page-client"
import type { Metadata } from "next"

type Props = {
  params: {
    locale: string
    slug: string
  }
  searchParams: {
    model?: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = params
  const supabase = createServerClient()

  let { data: service } = await supabase
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
    const { data } = await supabase
      .from("services")
      .select(`
        id,
        services_translations(
          name,
          description,
          locale
        )
      `)
      .eq("id", slug)
      .single()
    service = data
  }

  if (!service) {
    return {
      title: "Service not found | DeviceHelp",
      description: "The requested service could not be found.",
    }
  }

  const translation = service.services_translations?.find((t: any) => t.locale === locale)
  const serviceName = translation?.name || "Service"

  return {
    title: `${serviceName} | DeviceHelp`,
    description: translation?.description || `Professional ${serviceName} service with warranty.`,
  }
}

export default async function ServicePage({ params, searchParams }: Props) {
  const { slug, locale } = params
  const { model: modelSlug } = searchParams

  const supabase = createServerClient()

  try {
    let { data: service, error } = await supabase
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
          locale
        )
      `)
      .eq("slug", slug)
      .single()

    if (!service) {
      const { data, error: idError } = await supabase
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
            locale
          )
        `)
        .eq("id", slug)
        .single()

      service = data
      error = idError
    }

    if (error || !service) {
      notFound()
    }

    const translation = service.services_translations?.find((t: any) => t.locale === locale)

    if (!translation) {
      notFound()
    }

    // Отримуємо FAQ для послуги
    const { data: faqsData } = await supabase
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

    const faqs =
      faqsData
        ?.map((faq) => ({
          ...faq,
          translation: faq.service_faq_translations?.find((t: any) => t.locale === locale),
        }))
        .filter((faq) => faq.translation)
        .slice(0, 3) || []

    // Отримуємо дані моделі, якщо передано modelSlug
    let sourceModel = null
    let modelServicePrice = null
    if (modelSlug) {
      const { data: modelData } = await supabase
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

      sourceModel = modelData

      if (sourceModel) {
        const { data: modelServiceData } = await supabase
          .from("model_services")
          .select("price")
          .eq("model_id", sourceModel.id)
          .eq("service_id", service.id)
          .single()

        modelServicePrice = modelServiceData?.price
      }
    }

    // Отримуємо ціни для статистики
    const { data: modelServices } = await supabase.from("model_services").select("price").eq("service_id", service.id)

    const prices = modelServices?.map((ms) => ms.price).filter((p) => p !== null) || []
    const minPrice = prices.length > 0 ? Math.min(...prices) : null
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null

    const serviceData = {
      ...service,
      translation,
      faqs,
      sourceModel,
      modelServicePrice,
      minPrice,
      maxPrice,
    }

    return <ServicePageClient serviceData={serviceData} locale={locale} />
  } catch (error) {
    console.error("Error in ServicePage:", error)
    notFound()
  }
}
