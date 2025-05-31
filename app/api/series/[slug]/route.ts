import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug
    const supabase = createClient()

    // Спочатку спробуємо знайти за слагом
    let { data, error } = await supabase
      .from("series")
      .select("*, brand:brands(id, name, slug), models(id, name, slug, image_url)")
      .eq("slug", slug)
      .order("name", { foreignTable: "models" })
      .single()

    // Якщо не знайдено за слагом, спробуємо знайти за ID (для зворотної сумісності)
    if (error && error.code === "PGRST116") {
      const { data: dataById, error: errorById } = await supabase
        .from("series")
        .select("*, brand:brands(id, name, slug), models(id, name, slug, image_url)")
        .eq("id", slug)
        .order("name", { foreignTable: "models" })
        .single()

      if (errorById) {
        console.error("Error fetching series by ID:", errorById)
        return NextResponse.json({ error: "Series not found" }, { status: 404 })
      }

      data = dataById
    } else if (error) {
      console.error("Error fetching series:", error)
      return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
