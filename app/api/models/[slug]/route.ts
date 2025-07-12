import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params
    const url = new URL(request.url)
    const locale = url.searchParams.get("locale") || "uk"

    console.log(`Fetching model data for slug: ${slug}, locale: ${locale}`)

    const supabase = createClient()

    // Fetch model with brand and series info
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select(`
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
      `)
      .eq("slug", slug)
      .single()

    if (modelError || !model) {
      console.error("Model not found:", modelError)
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    console.log(`Found model: ${model.name}`)

    // Fetch model services with all the new columns
    const { data: modelServices, error: servicesError } = await supabase
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
        services (
          id,
          slug,
          position,
          image_url,
          services_translations (
            name,
            description,
            locale
          )
        )
      `)
      .eq("model_id", model.id)
      .order("services(position)", { ascending: true })

    if (servicesError) {
      console.error("Error fetching model services:", servicesError)
      return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
    }

    console.log(`Found ${modelServices?.length || 0} services for model`)

    // Transform services data to include translations and model-specific data
    const transformedServices = (modelServices || [])
      .map((modelService: any) => {
        const service = modelService.services
        if (!service) return null

        // Find translation for the requested locale, fallback to first available
        const translation =
          service.services_translations?.find((t: any) => t.locale === locale) || service.services_translations?.[0]

        if (!translation) return null

        return {
          id: modelService.id,
          slug: service.slug,
          name: translation.name,
          description: translation.description,
          price: modelService.price,
          position: service.position,
          // Use model-specific values from model_services table
          warranty_months: modelService.warranty_months,
          duration_hours: modelService.duration_hours,
          warranty_period: modelService.warranty_period,
          image_url: service.image_url,
          detailed_description: modelService.detailed_description,
          what_included: modelService.what_included,
          benefits: modelService.benefits,
        }
      })
      .filter(Boolean) // Remove null entries
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))

    const result = {
      ...model,
      services: transformedServices,
    }

    console.log(`Returning model data with ${transformedServices.length} services`)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching model:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
