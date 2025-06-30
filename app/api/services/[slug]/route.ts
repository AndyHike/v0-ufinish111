import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get("locale") || "uk"

    // Try to find service by slug first, then by ID
    let { data: service, error } = await supabase
      .from("services")
      .select(`
        id,
        slug,
        icon,
        position,
        services_translations!inner(
          name,
          description,
          locale
        )
      `)
      .eq("services_translations.locale", locale)
      .eq("slug", slug)
      .single()

    if (!service) {
      const { data, error: idError } = await supabase
        .from("services")
        .select(`
          id,
          slug,
          icon,
          position,
          services_translations!inner(
            name,
            description,
            locale
          )
        `)
        .eq("services_translations.locale", locale)
        .eq("id", slug)
        .single()

      service = data
      error = idError
    }

    if (error || !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Get models that support this service
    const { data: modelServices } = await supabase
      .from("model_services")
      .select(`
        id,
        price,
        models(
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
        )
      `)
      .eq("service_id", service.id)
      .order("price", { ascending: true })

    // Calculate stats
    const prices = modelServices?.map((ms) => ms.price).filter((p) => p !== null) || []
    const stats = {
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      modelsCount: modelServices?.length || 0,
    }

    return NextResponse.json({
      ...service,
      models: modelServices || [],
      stats,
    })
  } catch (error) {
    console.error("Error fetching service:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
