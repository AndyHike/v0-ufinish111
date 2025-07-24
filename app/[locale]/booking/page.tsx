import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import BookingPageClient from "./booking-page-client"

type Props = {
  params: {
    locale: string
  }
  searchParams: {
    service?: string
    model?: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params

  const titles = {
    en: "Book a Service | DeviceHelp",
    uk: "Бронювання послуги | DeviceHelp",
    cs: "Rezervace služby | DeviceHelp",
  }

  const descriptions = {
    en: "Book a repair service for your device. Choose date and time that works for you.",
    uk: "Забронюйте послугу ремонту для вашого пристрою. Оберіть зручну дату та час.",
    cs: "Rezervujte si opravu vašeho zařízení. Vyberte si datum a čas, který vám vyhovuje.",
  }

  return {
    title: titles[locale as keyof typeof titles] || titles.en,
    description: descriptions[locale as keyof typeof descriptions] || descriptions.en,
  }
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { locale } = params
  const { service: serviceSlug, model: modelSlug } = searchParams

  if (!serviceSlug || !modelSlug) {
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

    // Get model data
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
        ),
        series(
          id,
          name,
          slug
        )
      `)
      .eq("slug", modelSlug)
      .single()

    if (!model) {
      notFound()
    }

    // Get all available services for this model
    const { data: availableServices } = await supabase
      .from("model_services")
      .select(`
        price,
        services(
          id,
          slug,
          services_translations(
            name,
            locale
          )
        )
      `)
      .eq("model_id", model.id)

    // Get current service price
    const { data: currentServicePrice } = await supabase
      .from("model_services")
      .select("price")
      .eq("model_id", model.id)
      .eq("service_id", service.id)
      .single()

    const serviceTranslation = service.services_translations?.find((t: any) => t.locale === locale)
    if (!serviceTranslation) {
      notFound()
    }

    const availableServicesWithTranslations =
      availableServices
        ?.map((item: any) => {
          const translation = item.services.services_translations?.find((t: any) => t.locale === locale)
          if (!translation) return null
          return {
            id: item.services.id,
            slug: item.services.slug,
            name: translation.name,
            price: item.price,
          }
        })
        .filter(Boolean) || []

    const bookingData = {
      service: {
        id: service.id,
        slug: service.slug,
        name: serviceTranslation.name,
        price: currentServicePrice?.price || null,
      },
      model: {
        id: model.id,
        name: model.name,
        slug: model.slug,
        image_url: model.image_url,
        brand: {
          id: model.brands.id,
          name: model.brands.name,
          slug: model.brands.slug,
          logo_url: model.brands.logo_url,
        },
        series: model.series
          ? {
              id: model.series.id,
              name: model.series.name,
              slug: model.series.slug,
            }
          : null,
      },
      availableServices: availableServicesWithTranslations,
    }

    return <BookingPageClient bookingData={bookingData} locale={locale} />
  } catch (error) {
    console.error("Error in BookingPage:", error)
    notFound()
  }
}
