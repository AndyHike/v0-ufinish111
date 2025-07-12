import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get("locale") || "uk"

    console.log(`Fetching model data for slug: ${slug}, locale: ${locale}`)

    // Get model with brand and series info
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select(
        `
        id,
        name,
        slug,
        image_url,
        brands (
          id,
          name,
          slug,
          logo_url
        ),
        series (
          id,
          name,
          slug
        )
      `,
      )
      .eq("slug", slug)
      .single()

    if (modelError) {
      console.error("Model error:", modelError)
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    console.log("Found model:", model)

    // Get model services with service details and translations
    const { data: modelServices, error: servicesError } = await supabase
      .from("model_services")
      .select(
        `
        id,
        price,
        warranty_months,
        duration_hours,
        warranty_period,
        detailed_description,
        what_included,
        benefits,
        services (
          id,
          slug,
          image_url,
          position,
          services_translations (
            locale,
            name,
            description
          )
        )
      `,
      )
      .eq("model_id", model.id)
      .order("services(position)")

    if (servicesError) {
      console.error("Services error:", servicesError)
      return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
    }

    console.log("Found model services:", modelServices?.length || 0)

    // Transform services data to include model-specific data
    const services = modelServices
      ?.map((ms) => {
        const service = ms.services
        if (!service) return null

        // Find translation for current locale, fallback to first available
        const translation =
          service.services_translations?.find((t) => t.locale === locale) || service.services_translations?.[0]

        if (!translation) return null

        return {
          id: service.id,
          slug: service.slug,
          name: translation.name,
          description: translation.description,
          price: ms.price, // From model_services table
          position: service.position,
          warranty_months: ms.warranty_months, // From model_services table
          duration_hours: ms.duration_hours, // From model_services table
          warranty_period: ms.warranty_period, // From model_services table
          image_url: service.image_url,
          detailed_description: ms.detailed_description, // From model_services table
          what_included: ms.what_included, // From model_services table
          benefits: ms.benefits, // From model_services table
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.position - b.position)

    console.log("Transformed services:", services?.length || 0)

    const result = {
      ...model,
      services: services || [],
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching model:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
