import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()
    const { slug } = params

    // Отримуємо послугу за slug або ID
    const { data: service, error } = await supabase
      .from("services")
      .select(`
        *,
        service_descriptions (
          language,
          name,
          description,
          process_steps
        )
      `)
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .single()

    if (error) {
      console.error("Error fetching service:", error)
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Отримуємо моделі, які підтримують цю послугу
    const { data: models, error: modelsError } = await supabase
      .from("model_services")
      .select(`
        price,
        models (
          id,
          name,
          slug,
          image_url,
          brands (
            id,
            name,
            slug
          ),
          series (
            id,
            name,
            slug
          )
        )
      `)
      .eq("service_id", service.id)
      .order("price", { ascending: true })

    if (modelsError) {
      console.error("Error fetching models:", modelsError)
    }

    // Отримуємо статистику послуги
    const { data: stats, error: statsError } = await supabase
      .from("model_services")
      .select("price")
      .eq("service_id", service.id)

    let serviceStats = {
      minPrice: 0,
      maxPrice: 0,
      avgPrice: 0,
      modelsCount: 0,
    }

    if (!statsError && stats && stats.length > 0) {
      const prices = stats.map((s) => s.price).filter((p) => p > 0)
      if (prices.length > 0) {
        serviceStats = {
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          modelsCount: prices.length,
        }
      }
    }

    return NextResponse.json({
      ...service,
      models: models || [],
      stats: serviceStats,
    })
  } catch (error) {
    console.error("Error in service API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
