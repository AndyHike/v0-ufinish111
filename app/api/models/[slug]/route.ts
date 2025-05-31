import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug
    const supabase = createClient()

    // Спочатку спробуємо знайти за слагом
    let { data, error } = await supabase
      .from("models")
      .select(`
        *,
        brand:brands(id, name, slug),
        series:series(id, name, slug),
        model_services(
          id,
          price,
          service:services(id, name, description)
        )
      `)
      .eq("slug", slug)
      .single()

    // Якщо не знайдено за слагом, спробуємо знайти за ID (для зворотної сумісності)
    if (error && error.code === "PGRST116") {
      const { data: dataById, error: errorById } = await supabase
        .from("models")
        .select(`
          *,
          brand:brands(id, name, slug),
          series:series(id, name, slug),
          model_services(
            id,
            price,
            service:services(id, name, description)
          )
        `)
        .eq("id", slug)
        .single()

      if (errorById) {
        console.error("Error fetching model by ID:", errorById)
        return NextResponse.json({ error: "Model not found" }, { status: 404 })
      }

      data = dataById
    } else if (error) {
      console.error("Error fetching model:", error)
      return NextResponse.json({ error: "Failed to fetch model" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
