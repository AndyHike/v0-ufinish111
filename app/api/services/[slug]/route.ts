import { NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const supabase = createServerClient()
    const { slug } = params

    // Спочатку спробуємо знайти за slug
    let { data: service, error } = await supabase
      .from("services")
      .select(`
        id,
        position,
        services_translations(
          name,
          description,
          locale
        )
      `)
      .eq("slug", slug)
      .single()

    // Якщо не знайдено за slug, спробуємо за ID
    if (!service) {
      const { data, error: idError } = await supabase
        .from("services")
        .select(`
          id,
          position,
          services_translations(
            name,
            description,
            locale
          )
        `)
        .eq("id", slug)
        .single()

      service = data
      error = idError
    }

    if (error || !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Отримуємо всі моделі, які підтримують цю послугу
    const { data: modelServices } = await supabase
      .from("model_services")
      .select(`
        id,
        price,
        model_id,
        models(
          id,
          name,
          slug,
          image_url,
          brands(
            id,
            name,
            logo_url
          )
        )
      `)
      .eq("service_id", service.id)

    return NextResponse.json({
      service,
      modelServices: modelServices || [],
    })
  } catch (error) {
    console.error("Error in services API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
