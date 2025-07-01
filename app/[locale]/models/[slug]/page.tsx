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

    const { data: modelServices } = await supabase
      .from("model_services")
      .select(`
        id,
        price,
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

    const servicesWithTranslations =
      modelServices
        ?.map((ms) => {
          const service = ms.services
          if (!service) return null

          const translation = service.services_translations?.find((t: any) => t.locale === locale)
          if (!translation) return null

          return {
            id: service.id,
            slug: service.slug,
            name: translation.name,
            description: translation.description,
            price: ms.price,
            position: service.position,
            warranty_months: service.warranty_months,
            duration_hours: service.duration_hours,
            image_url: service.image_url,
          }
        })
        .filter(Boolean) || []

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
    console.error("Error in ModelPage:", error)
    notFound()
  }
}
