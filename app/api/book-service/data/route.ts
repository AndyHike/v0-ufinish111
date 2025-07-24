import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceSlug = searchParams.get("service_slug")
    const modelSlug = searchParams.get("model_slug")
    const locale = searchParams.get("locale") || "uk"

    if (!serviceSlug) {
      return NextResponse.json({ error: "Service slug is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Отримуємо дані послуги
    const { data: serviceData, error: serviceError } = await supabase
      .from("services")
      .select(`
        id,
        slug,
        image_url,
        warranty_months,
        warranty_period,
        duration_hours,
        service_translations!inner(
          name,
          description,
          detailed_description
        )
      `)
      .eq("slug", serviceSlug)
      .eq("service_translations.locale", locale)
      .single()

    if (serviceError || !serviceData) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    let modelData = null
    let price = null

    // Якщо є slug моделі, отримуємо дані моделі та ціну
    if (modelSlug) {
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
          )
        `)
        .eq("slug", modelSlug)
        .single()

      if (!modelError && model) {
        modelData = model

        // Отримуємо ціну для конкретної моделі та послуги
        const { data: modelService } = await supabase
          .from("model_services")
          .select("price")
          .eq("model_id", model.id)
          .eq("service_id", serviceData.id)
          .single()

        if (modelService && modelService.price !== null) {
          price = modelService.price
        }
      }
    }

    // Якщо немає конкретної ціни, отримуємо діапазон цін
    if (price === null) {
      const { data: priceRange } = await supabase
        .from("model_services")
        .select("price")
        .eq("service_id", serviceData.id)
        .not("price", "is", null)

      if (priceRange && priceRange.length > 0) {
        const prices = priceRange.map((p) => p.price).filter((p) => p !== null)
        if (prices.length > 0) {
          const minPrice = Math.min(...prices)
          const maxPrice = Math.max(...prices)
          price = minPrice === maxPrice ? minPrice : { min: minPrice, max: maxPrice }
        }
      }
    }

    return NextResponse.json({
      service: {
        id: serviceData.id,
        slug: serviceData.slug,
        name: serviceData.service_translations[0].name,
        description: serviceData.service_translations[0].description,
        detailed_description: serviceData.service_translations[0].detailed_description,
        image_url: serviceData.image_url,
        warranty_months: serviceData.warranty_months,
        warranty_period: serviceData.warranty_period,
        duration_hours: serviceData.duration_hours,
      },
      model: modelData,
      price: price,
    })
  } catch (error) {
    console.error("Error fetching booking data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
