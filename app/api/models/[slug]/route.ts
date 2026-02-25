import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

// ISR cache - 1 hour
export const revalidate = 3600

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get("locale") || "uk"

    console.log(`[v0] Fetching model data for slug: ${slug}, locale: ${locale}`)

    // Спочатку спробуємо знайти за слагом
    let { data: model, error } = await supabase
      .from("models")
      .select(`
        *,
        brands(id, name, slug, logo_url),
        series(id, name, slug)
      `)
      .eq("slug", slug)
      .single()

    // Якщо не знайдено за слагом, спробуємо знайти за ID (для зворотної сумісності)
    if (error && error.code === "PGRST116") {
      const { data: dataById, error: errorById } = await supabase
        .from("models")
        .select(`
          *,
          brands(id, name, slug, logo_url),
          series(id, name, slug)
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
        part_type,
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

    // Отримуємо базові послуги для fallback даних
    const { data: baseServices, error: baseServicesError } = await supabase
      .from("services")
      .select(`
        id,
        warranty_months,
        duration_hours
      `)

    if (baseServicesError) {
      console.error("Error fetching base services:", baseServicesError)
    }

    // Створюємо map базових послуг для швидкого пошуку
    const baseServiceMap = new Map(baseServices?.map(s => [s.id, s]) || [])

    // Трансформуємо дані послуг з правильною конвертацією типів та fallback на базові послуги
    const services = modelServices
      ?.map((ms) => {
        const serviceRaw = ms.services
        const service = Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw
        if (!service) return null

        // Знаходимо переклад для поточної локалі
        const translations = service.services_translations as any[]
        const translation =
          translations?.find((t: any) => t.locale === locale) || translations?.[0]

        if (!translation) return null

        // Отримуємо базову послугу для fallback
        const baseService = baseServiceMap.get(service.id)

        // Правильна конвертація типів даних з fallback на базову послугу
        const price = ms.price ? Number.parseFloat(ms.price.toString()) : null

        // Гарантія: спочатку з model_services, потім з базової services
        let warrantyMonths = ms.warranty_months ? Number.parseInt(ms.warranty_months.toString()) : null
        if (warrantyMonths === null && baseService?.warranty_months) {
          warrantyMonths = baseService.warranty_months
        }

        // Період гарантії (days/months) - беремо тільки з model_services, немає у базової services
        let warrantyPeriod = ms.warranty_period || "months"

        // Тривалість: спочатку з model_services, потім з базової services
        let durationHours = ms.duration_hours ? Number.parseFloat(ms.duration_hours.toString()) : null
        if (durationHours === null && baseService?.duration_hours) {
          durationHours = baseService.duration_hours
        }

        return {
          id: service.id,
          slug: service.slug,
          name: translation.name,
          description: translation.description,
          // ВАЖЛИВО: Використовуємо дані з model_services, а якщо немає - з базової services
          price: price,
          warranty_months: warrantyMonths,
          duration_hours: durationHours,
          warranty_period: warrantyPeriod,
          position: service.position,
          image_url: service.image_url,
          detailed_description: ms.detailed_description,
          what_included: ms.what_included,
          benefits: ms.benefits,
          part_type: ms.part_type || null,
        }
      })
      .filter(Boolean)
      .sort((a, b) => (a.position || 0) - (b.position || 0))

    console.log("Transformed services with model-specific data:", services?.length || 0)

    // Normalize brands and series from arrays to single objects (Supabase returns arrays for relations)
    const brandObj = Array.isArray(model.brands) ? model.brands[0] : model.brands
    const seriesObj = Array.isArray(model.series) ? model.series[0] : model.series

    const result = {
      ...model,
      brands: brandObj || null,
      series: seriesObj || null,
      services: services || [],
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
