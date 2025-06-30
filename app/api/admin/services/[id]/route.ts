import { NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { id } = params

    const { data: service, error } = await supabase
      .from("services")
      .select(`
        *,
        services_translations(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(service)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { id } = params
    const body = await request.json()

    const { warranty_months, duration_hours, image_url, slug, translations } = body

    // Оновлюємо основну таблицю services
    const { error: serviceError } = await supabase
      .from("services")
      .update({
        warranty_months,
        duration_hours,
        image_url,
        slug,
      })
      .eq("id", id)

    if (serviceError) {
      return NextResponse.json({ error: serviceError.message }, { status: 400 })
    }

    // Оновлюємо переклади
    if (translations && Array.isArray(translations)) {
      for (const translation of translations) {
        const { locale, name, description, detailed_description, what_included, benefits } = translation

        const { error: translationError } = await supabase.from("services_translations").upsert({
          service_id: id,
          locale,
          name,
          description,
          detailed_description,
          what_included,
          benefits,
        })

        if (translationError) {
          return NextResponse.json({ error: translationError.message }, { status: 400 })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
