import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get("locale") || "uk"

    console.log(`[MODELS API] Fetching model data for slug: ${slug}, locale: ${locale}`)

    // Отримуємо дані моделі
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
      console.error("[MODELS API] Model not found:", modelError)
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    console.log(`[MODELS API] Found model: ${model.id} - ${model.name}`)

    // Отримуємо послуги для моделі з правильною конвертацією типів
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
        service_id,
        services!inner (
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
      `)
      .eq("model_id", model.id)
      .order("services(position)")

    if (servicesError) {
      console.error("[MODELS API] Error fetching services:", servicesError)
      return NextResponse.json({ error: "Error fetching services" }, { status: 500 })
    }

    console.log(`[MODELS API] Found ${modelServices?.length || 0} services for model`)

    // Трансформуємо дані послуг з правильною конвертацією типів
    const services =
      modelServices
        ?.map((ms) => {
          const service = ms.services
          if (!service) return null

          const translation = service.services_translations?.find((t: any) => t.locale === locale)
          if (!translation) return null

          // Правильна конвертація типів даних з бази
          const price = ms.price ? Number.parseFloat(ms.price.toString()) : null
          const warrantyMonths = ms.warranty_months ? Number.parseInt(ms.warranty_months.toString()) : null
          const durationHours = ms.duration_hours ? Number.parseFloat(ms.duration_hours.toString()) : null

          console.log(`[MODELS API] Converting service ${service.slug}:`, {
            original_price: ms.price,
            converted_price: price,
            original_warranty_months: ms.warranty_months,
            converted_warranty_months: warrantyMonths,
            original_duration_hours: ms.duration_hours,
            converted_duration_hours: durationHours,
            warranty_period: ms.warranty_period,
          })

          return {
            id: service.id,
            slug: service.slug,
            name: translation.name,
            description: translation.description,
            // ВАЖЛИВО: Використовуємо правильно конвертовані дані з model_services
            price: price,
            warranty_months: warrantyMonths,
            duration_hours: durationHours,
            warranty_period: ms.warranty_period || "months",
            position: service.position,
            image_url: service.image_url,
            detailed_description: ms.detailed_description,
            what_included: ms.what_included,
            benefits: ms.benefits,
          }
        })
        .filter(Boolean)
        .sort((a, b) => a.position - b.position) || []

    const modelData = {
      id: model.id,
      name: model.name,
      slug: model.slug,
      image_url: model.image_url,
      brands: model.brands,
      series: model.series,
      services: services,
    }

    console.log(`[MODELS API] Returning model data with ${services.length} services`)

    return NextResponse.json(modelData)
  } catch (error) {
    console.error("[MODELS API] Error in models API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
