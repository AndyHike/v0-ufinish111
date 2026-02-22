import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = createClient()

    console.log("[v0] Fetching brand for slug:", slug)

    // Спочатку спробуємо знайти за слагом
    let { data: brand, error } = await supabase
      .from("brands")
      .select("*, series(id, name, slug, position)")
      .eq("slug", slug)
      .single()

    // Якщо не знайдено за слагом, спробуємо знайти за ID
    if ((error && error.code === "PGRST116") || !brand) {
      console.log("[v0] Brand not found by slug, trying by ID:", slug)
      const { data: dataById, error: errorById } = await supabase
        .from("brands")
        .select("*, series(id, name, slug, position)")
        .eq("id", slug)
        .single()

      if (errorById || !dataById) {
        console.error("[v0] Error fetching brand by ID:", errorById)
        return NextResponse.json({ error: "Brand not found" }, { status: 404 })
      }

      brand = dataById
    } else if (error) {
      console.error("[v0] Error fetching brand:", error)
      return NextResponse.json({ error: "Failed to fetch brand", details: error.message }, { status: 500 })
    }

    if (!brand) {
      console.error("[v0] Brand is null after fetch")
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // Сортуємо серії на стороні сервера
    if (brand?.series && Array.isArray(brand.series)) {
      brand.series = (brand.series as any[]).sort((a, b) => {
        const aPos = a.position || 999
        const bPos = b.position || 999
        return aPos - bPos
      })
    }

    console.log("[v0] Fetching models for brand:", brand.id)

    // Fetch models without series
    const { data: modelsWithoutSeries, error: modelsError } = await supabase
      .from("models")
      .select("id, name, slug, image_url")
      .eq("brand_id", brand.id)
      .is("series_id", null)
      .order("position", { ascending: true })

    if (modelsError) {
      console.error("[v0] Error fetching models:", modelsError)
    }

    const responseData = {
      brand,
      modelsWithoutSeries: modelsWithoutSeries || [],
    }

    console.log("[v0] Returning brand data:", { brandId: brand.id, seriesCount: brand.series?.length, modelsCount: modelsWithoutSeries?.length })

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[v0] Unexpected error in brands API:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 })
  }
}
