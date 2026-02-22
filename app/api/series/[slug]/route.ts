import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    // Спочатку спробуємо знайти за слагом
    let { data: seriesData, error } = await supabase
      .from("series")
      .select("*, brands(id, name, slug, logo_url)")
      .eq("slug", slug)
      .single()

    // Якщо не знайдено за слагом, спробуємо знайти за ID
    if ((error && error.code === "PGRST116") || !seriesData) {
      const { data: dataById, error: errorById } = await supabase
        .from("series")
        .select("*, brands(id, name, slug, logo_url)")
        .eq("id", slug)
        .single()

      if (errorById || !dataById) {
        console.error("[v0] Error fetching series by ID:", errorById)
        return NextResponse.json({ error: "Series not found" }, { status: 404 })
      }

      seriesData = dataById
    } else if (error) {
      console.error("[v0] Error fetching series:", error)
      return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 })
    }

    // Fetch models for this series
    const { data: models, error: modelsError } = await supabase
      .from("models")
      .select("id, name, slug, image_url, created_at")
      .eq("series_id", seriesData.id)
      .order("position", { ascending: true })

    const responseData = {
      series: seriesData,
      models: models || [],
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
