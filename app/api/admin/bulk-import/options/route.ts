import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createClient()

    // Fetch all data needed for dropdowns
    const [servicesResult, brandsResult, seriesResult, modelsResult] = await Promise.all([
      supabase
        .from("services")
        .select(`
          id,
          slug,
          name,
          services_translations(
            name,
            locale
          )
        `)
        .order("name"),
      supabase.from("brands").select("id, name, slug").order("name"),
      supabase.from("series").select("id, name, slug, brand_id").order("name"),
      supabase.from("models").select("id, name, slug, brand_id, series_id").order("name"),
    ])

    if (servicesResult.error) {
      console.error("Error fetching services:", servicesResult.error)
      return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
    }

    if (brandsResult.error) {
      console.error("Error fetching brands:", brandsResult.error)
      return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 })
    }

    if (seriesResult.error) {
      console.error("Error fetching series:", seriesResult.error)
      return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 })
    }

    if (modelsResult.error) {
      console.error("Error fetching models:", modelsResult.error)
      return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 })
    }

    // Transform services to include translated names
    const services = servicesResult.data.map((service) => {
      // Try to get Ukrainian translation first, then fallback to service name
      const ukTranslation = service.services_translations?.find((t: any) => t.locale === "uk")
      const displayName = ukTranslation?.name || service.name || `Service ${service.id}`

      return {
        id: service.id,
        name: displayName,
        slug: service.slug,
      }
    })

    return NextResponse.json({
      services,
      brands: brandsResult.data,
      series: seriesResult.data,
      models: modelsResult.data,
    })
  } catch (error) {
    console.error("Error fetching options:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
