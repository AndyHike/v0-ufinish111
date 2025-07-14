import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import ServicePageClient from "./service-page-client"

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

  return {
    title: `${serviceName} | DeviceHelp`,
    description: translation?.description || `Professional ${serviceName} service`,
  }
}

export default async function ServicePage({ params, searchParams }: Props) {
  const { slug, locale } = params
  const { model: modelSlug } = searchParams

  const supabase = createServerClient()

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
          locale
        )
      `)
      .eq("slug", slug)
      .single()

    if (serviceError || !service) {
      notFound()
    }

    const translation = service.services_translations?.find((t: any) => t.locale === locale)
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
        ?.map((faq) => {
          const faqTranslation = faq.service_faq_translations?.find((t: any) => t.locale === locale)
          if (!faqTranslation) return null
          return {
            id: faq.id,
            position: faq.position,
            translation: {
              question: faqTranslation.question,
              answer: faqTranslation.answer,
            },
          }
        })
        .filter(Boolean) || []

    // Get source model if specified
    let sourceModel = null
    let modelServicePrice = null
    let modelWarrantyMonths = null
    let modelDurationHours = null

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
        sourceModel = model

        // ВИПРАВЛЕНО: Отримуємо ВСІ дані з model_services, включаючи warranty та duration
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
          // ВИПРАВЛЕНО: Зберігаємо warranty та duration з model_services
          modelWarrantyMonths = modelService.warranty_months
          modelDurationHours = modelService.duration_hours

          console.log("Model-specific service data found:", {
            price: modelServicePrice,
            warranty_months: modelWarrantyMonths,
            duration_hours: modelDurationHours,
            source: "model_services table",
          })
        } else {
          console.log("No model-specific service data found, using service defaults")
        }
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
      position: service.position,
      // ВИПРАВЛЕНО: Використовуємо пріоритетну логіку для warranty та duration
      warranty_months:
        modelWarrantyMonths !== null && modelWarrantyMonths !== undefined
          ? modelWarrantyMonths
          : service.warranty_months,
      duration_hours:
        modelDurationHours !== null && modelDurationHours !== undefined ? modelDurationHours : service.duration_hours,
      image_url: service.image_url,
      slug: service.slug,
      translation: {
        name: translation.name,
        description: translation.description,
        detailed_description: translation.detailed_description,
        what_included: translation.what_included,
      },
      faqs: faqsWithTranslations,
      sourceModel,
      modelServicePrice,
      minPrice,
      maxPrice,
    }

    console.log("Final service data:", {
      warranty_months: serviceData.warranty_months,
      duration_hours: serviceData.duration_hours,
      warranty_source: modelWarrantyMonths !== null ? "model_services" : "services",
      duration_source: modelDurationHours !== null ? "model_services" : "services",
      modelServicePrice: serviceData.modelServicePrice,
      hasSourceModel: !!sourceModel,
    })

    return <ServicePageClient serviceData={serviceData} locale={locale} />
  } catch (error) {
    console.error("Error in ServicePage:", error)
    notFound()
  }
}
