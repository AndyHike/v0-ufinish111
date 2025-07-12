import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createClient()

    const [servicesResult, brandsResult, seriesResult, modelsResult] = await Promise.all([
      supabase.from("services").select("id, name, slug").order("name"),
      supabase.from("brands").select("id, name, slug").order("position", { ascending: true }),
      supabase.from("series").select("id, name, slug, brand_id").order("position", { ascending: true }),
      supabase.from("models").select("id, name, slug, brand_id, series_id").order("position", { ascending: true }),
    ])

    return NextResponse.json({
      services: servicesResult.data || [],
      brands: brandsResult.data || [],
      series: seriesResult.data || [],
      models: modelsResult.data || [],
    })
  } catch (error) {
    console.error("Error fetching options:", error)
    return NextResponse.json({ error: "Failed to fetch options" }, { status: 500 })
  }
}
