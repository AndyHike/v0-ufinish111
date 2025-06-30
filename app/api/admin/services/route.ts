import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: services, error } = await supabase
      .from("services")
      .select(`
        id,
        slug,
        position,
        warranty_months,
        duration_hours,
        image_url,
        services_translations(
          id,
          name,
          description,
          detailed_description,
          what_included,
          benefits,
          locale
        )
      `)
      .order("position")

    if (error) {
      console.error("Error fetching services:", error)
      return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
    }

    return NextResponse.json({ services })
  } catch (error) {
    console.error("Error in GET /api/admin/services:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { slug, position, warranty_months, duration_hours, image_url, translations } = body

    // Створюємо послугу
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .insert({
        slug,
        position,
        warranty_months,
        duration_hours,
        image_url,
      })
      .select()
      .single()

    if (serviceError) {
      console.error("Error creating service:", serviceError)
      return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
    }

    // Створюємо переклади
    const translationInserts = Object.entries(translations).map(([locale, translation]: [string, any]) => ({
      service_id: service.id,
      locale,
      name: translation.name,
      description: translation.description,
      detailed_description: translation.detailed_description,
      what_included: translation.what_included,
      benefits: translation.benefits,
    }))

    const { error: translationsError } = await supabase.from("services_translations").insert(translationInserts)

    if (translationsError) {
      console.error("Error creating translations:", translationsError)
      // Видаляємо створену послугу якщо переклади не створилися
      await supabase.from("services").delete().eq("id", service.id)
      return NextResponse.json({ error: "Failed to create translations" }, { status: 500 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error("Error in POST /api/admin/services:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
