import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createClient()

    // Get all services with translations
    const { data: servicesData, error: servicesError } = await supabase
      .from("services")
      .select(`
        id,
        slug,
        name,
        services_translations!inner(name, locale)
      `)
      .eq("services_translations.locale", "uk")
      .order("name")

    if (servicesError) {
      console.error("Error fetching services:", servicesError)
      return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
    }

    // Get all brands
    const { data: brandsData, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, slug")
      .order("name")

    if (brandsError) {
      console.error("Error fetching brands:", brandsError)
      return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 })
    }

    // Get all series
    const { data: seriesData, error: seriesError } = await supabase
      .from("series")
      .select("id, name, slug, brand_id")
      .order("name")

    if (seriesError) {
      console.error("Error fetching series:", seriesError)
      return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 })
    }

    // Get all models
    const { data: modelsData, error: modelsError } = await supabase
      .from("models")
      .select("id, name, slug, brand_id, series_id")
      .order("name")

    if (modelsError) {
      console.error("Error fetching models:", modelsError)
      return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 })
    }

    // Format services data
    const services =
      servicesData?.map((service) => ({
        id: service.id,
        name: service.services_translations[0]?.name || service.name,
        slug: service.slug,
      })) || []

    return NextResponse.json({
      services,
      brands: brandsData || [],
      series: seriesData || [],
      models: modelsData || [],
    })
  } catch (error) {
    console.error("Error in options API:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
