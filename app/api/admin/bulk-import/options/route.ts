import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createClient()

    const [servicesResult, brandsResult, seriesResult, modelsResult] = await Promise.all([
      supabase.from("services").select("id, name, slug").order("name"),
      supabase.from("brands").select("id, name, slug").order("name"),
      supabase.from("series").select("id, name, slug, brand_id").order("name"),
      supabase.from("models").select("id, name, slug, brand_id, series_id").order("name"),
    ])

    if (servicesResult.error) throw servicesResult.error
    if (brandsResult.error) throw brandsResult.error
    if (seriesResult.error) throw seriesResult.error
    if (modelsResult.error) throw modelsResult.error

    return NextResponse.json({
      services: servicesResult.data || [],
      brands: brandsResult.data || [],
      series: seriesResult.data || [],
      models: modelsResult.data || [],
    })
  } catch (error) {
    console.error("Error fetching options:", error)
    return NextResponse.json(
      { error: "Failed to fetch options", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
