import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug
    const supabase = createClient()

    // Спочатку спробуємо знайти за слагом
    let { data: brand, error } = await supabase
      .from("brands")
      .select("*, series(id, name, slug, position)")
      .eq("slug", slug)
      .single()

    // Якщо не знайдено за слагом, спробуємо знайти за ID
    if (error && error.code === "PGRST116") {
      const { data: dataById, error: errorById } = await supabase
        .from("brands")
        .select("*, series(id, name, slug, position)")
        .eq("id", slug)
        .single()

      if (errorById) {
        console.error("[v0] Error fetching brand by ID:", errorById)
        return NextResponse.json({ error: "Brand not found" }, { status: 404 })
      }

      brand = dataById
    } else if (error) {
      console.error("[v0] Error fetching brand:", error)
      return NextResponse.json({ error: "Failed to fetch brand" }, { status: 500 })
    }

    // Сортуємо серії на клієнтській стороні, оскільки Supabase не дозволяє сортувати по пов'язаним таблицям за замовчуванням
    if (brand?.series) {
      brand.series = (brand.series as any[]).sort((a, b) => {
        const aPos = a.position || 999
        const bPos = b.position || 999
        return aPos - bPos
      })
    }

    // Fetch models without series
    const { data: modelsWithoutSeries, error: modelsError } = await supabase
      .from("models")
      .select("id, name, slug, image_url")
      .eq("brand_id", brand.id)
      .is("series_id", null)
      .order("position", { ascending: true })

    const responseData = {
      brand,
      modelsWithoutSeries: modelsWithoutSeries || [],
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[v0] Unexpected error in brands API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
