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

  return {
    title: `${model.brands?.name} ${model.name} | DeviceHelp`,
    description: `Professional repair services for ${model.brands?.name} ${model.name}. Fast, reliable, and affordable.`,
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
