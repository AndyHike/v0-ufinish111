import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
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

export default async function BookingPage({
  params: { locale },
  searchParams: { service: serviceSlug, model: modelSlug },
}: Props) {
  const t = await getTranslations("Booking")

  if (!serviceSlug || !modelSlug) {
    notFound()
  }

  const supabase = createServerClient()

  try {
    // Get service data
    const { data: service, error: serviceError } = await supabase
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

    if (serviceError || !service) {
      notFound()
    }

    // Get model data
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select(`
        id,
        name,
        slug,
        brands(
          id,
          name,
          slug,
          series(
            id,
            name,
            slug
          )
        )
      `)
      .eq("slug", modelSlug)
      .single()

    if (modelError || !model) {
      notFound()
    }

    // Get service price for this model
    const { data: modelService } = await supabase
      .from("model_services")
      .select("price, warranty_months, duration_hours")
      .eq("model_id", model.id)
      .eq("service_id", service.id)
      .single()

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

    const serviceTranslation = service.services_translations?.find((t: any) => t.locale === locale)
    if (!serviceTranslation) {
      notFound()
    }

    const availableServicesWithTranslations =
      availableServices
        ?.map((ms: any) => {
          const translation = ms.services?.services_translations?.find((t: any) => t.locale === locale)
          if (!translation) return null
          return {
            id: ms.services.id,
            slug: ms.services.slug,
            name: translation.name,
            price: ms.price,
          }
        })
        .filter(Boolean) || []

    const bookingData = {
      service: {
        id: service.id,
        slug: service.slug,
        name: serviceTranslation.name,
        description: serviceTranslation.description,
        price: modelService?.price || null,
        warranty_months: modelService?.warranty_months || null,
        duration_hours: modelService?.duration_hours || null,
      },
      model: {
        id: model.id,
        name: model.name,
        slug: model.slug,
        brand: {
          id: model.brands?.id,
          name: model.brands?.name,
          slug: model.brands?.slug,
        },
        series: {
          id: model.brands?.series?.id,
          name: model.brands?.series?.name,
          slug: model.brands?.series?.slug,
        },
      },
      availableServices: availableServicesWithTranslations,
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">{t("title")}</h1>
          <p className="text-gray-600 text-center max-w-2xl mx-auto">{t("description")}</p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <BookingPageClient bookingData={bookingData} locale={locale} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error("Error in BookingPage:", error)
    notFound()
  }
}

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "Booking" })

  return {
    title: t("title"),
    description: t("description"),
  }
}
