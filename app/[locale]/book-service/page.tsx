import { Suspense } from "react"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import BookServiceClient from "./book-service-client"
import type { Metadata } from "next"

type Props = {
  params: {
    locale: string
  }
  searchParams: {
    service?: string
    brand?: string
    model?: string
    series?: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params

  const titles = {
    uk: "Бронювання послуги | DeviceHelp",
    cs: "Rezervace služby | DeviceHelp",
    en: "Book Service | DeviceHelp",
  }

  return {
    title: titles[locale as keyof typeof titles] || titles.en,
    description: "Book a repair service for your device",
  }
}

export default async function BookServicePage({ params, searchParams }: Props) {
  const { locale } = params
  const { service: serviceSlug, brand: brandSlug, model: modelSlug, series: seriesSlug } = searchParams

  // Validate required parameters
  if (!serviceSlug || !brandSlug || !modelSlug) {
    notFound()
  }

  const supabase = createServerClient()

  try {
    // Get service data
    const { data: service } = await supabase
      .from("services")
      .select(`
        id,
        slug,
        services_translations(
          name,
          description,
          locale
        )
      `)
      .eq("slug", serviceSlug)
      .single()

    if (!service) {
      notFound()
    }

    // Get brand data
    const { data: brand } = await supabase.from("brands").select("id, name, slug").eq("slug", brandSlug).single()

    if (!brand) {
      notFound()
    }

    // Get model data
    const { data: model } = await supabase
      .from("models")
      .select("id, name, slug")
      .eq("slug", modelSlug)
      .eq("brand_id", brand.id)
      .single()

    if (!model) {
      notFound()
    }

    // Get series data if provided
    let series = null
    if (seriesSlug) {
      const { data: seriesData } = await supabase
        .from("series")
        .select("id, name, slug")
        .eq("slug", seriesSlug)
        .eq("brand_id", brand.id)
        .single()

      series = seriesData
    }

    // Get service price for this model
    const { data: modelService } = await supabase
      .from("model_services")
      .select("price")
      .eq("model_id", model.id)
      .eq("service_id", service.id)
      .single()

    const serviceTranslation = service.services_translations?.find((t: any) => t.locale === locale)

    const bookingData = {
      service: {
        id: service.id,
        slug: service.slug,
        name: serviceTranslation?.name || "Service",
        description: serviceTranslation?.description || "",
        price: modelService?.price || null,
      },
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
      },
      model: {
        id: model.id,
        name: model.name,
        slug: model.slug,
      },
      series: series
        ? {
            id: series.id,
            name: series.name,
            slug: series.slug,
          }
        : null,
    }

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <BookServiceClient bookingData={bookingData} locale={locale} />
      </Suspense>
    )
  } catch (error) {
    console.error("Error in BookServicePage:", error)
    notFound()
  }
}
