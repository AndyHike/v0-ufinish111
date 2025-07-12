import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get("locale") || "uk"

    console.log(`Fetching model data for slug: ${slug}, locale: ${locale}`)

    // Спочатку спробуємо знайти за слагом
    let { data: model, error } = await supabase
      .from("models")
      .select(`
        *,
        brand:brands(id, name, slug, logo_url),
        series:series(id, name, slug)
      `)
      .eq("slug", slug)
      .single()

    // Якщо не знайдено за слагом, спробуємо знайти за ID (для зворотної сумісності)
    if (error && error.code === "PGRST116") {
      const { data: dataById, error: errorById } = await supabase
        .from("models")
        .select(`
          *,
          brand:brands(id, name, slug, logo_url),
          series:series(id, name, slug)
        `)
        .eq("id", slug)
        .single()

      if (errorById) {
        console.error("Error fetching model by ID:", errorById)
        return NextResponse.json({ error: "Model not found" }, { status: 404 })
      }

      model = dataById
    } else if (error) {
      console.error("Error fetching model:", error)
      return NextResponse.json({ error: "Failed to fetch model" }, { status: 500 })
    }

    console.log("Found model:", model.name)

    // Отримуємо послуги моделі з правильними даними з model_services
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

    if (servicesError) {
      console.error("Error fetching model services:", servicesError)
      return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
    }

    console.log(`Found ${modelServices?.length || 0} model services`)

    // Трансформуємо дані послуг
    const services = modelServices
      ?.map((ms) => {
        const service = ms.services
        if (!service) return null

        // Знаходимо переклад для поточної локалі
        const translation =
          service.services_translations?.find((t) => t.locale === locale) || service.services_translations?.[0]

        if (!translation) return null

        return {
          id: service.id,
          slug: service.slug,
          name: translation.name,
          description: translation.description,
          // ВАЖЛИВО: Використовуємо дані з model_services, а не з services
          price: ms.price,
          warranty_months: ms.warranty_months,
          duration_hours: ms.duration_hours,
          warranty_period: ms.warranty_period || "months",
          position: service.position,
          image_url: service.image_url,
          detailed_description: ms.detailed_description,
          what_included: ms.what_included,
          benefits: ms.benefits,
        }
      })
      .filter(Boolean)
      .sort((a, b) => (a.position || 0) - (b.position || 0))

    console.log("Transformed services with model-specific data:", services?.length || 0)

    const result = {
      ...model,
      services: services || [],
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
