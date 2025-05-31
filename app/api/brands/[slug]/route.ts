import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug
    const supabase = createClient()

    // Спочатку спробуємо знайти за слагом
    let { data, error } = await supabase
      .from("brands")
      .select("*, series(id, name, slug, position)")
      .eq("slug", slug)
      .order("position", { foreignTable: "series", ascending: true })
      .single()

    // Якщо не знайдено за слагом, спробуємо знайти за ID (для зворотної сумісності)
    if (error && error.code === "PGRST116") {
      const { data: dataById, error: errorById } = await supabase
        .from("brands")
        .select("*, series(id, name, slug, position)")
        .eq("id", slug)
        .order("position", { foreignTable: "series", ascending: true })
        .single()

      if (errorById) {
        console.error("Error fetching brand by ID:", errorById)
        return NextResponse.json({ error: "Brand not found" }, { status: 404 })
      }

      data = dataById
    } else if (error) {
      console.error("Error fetching brand:", error)
      return NextResponse.json({ error: "Failed to fetch brand" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
