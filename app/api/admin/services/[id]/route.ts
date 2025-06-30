import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { id } = params

    const { slug, position, warranty_months, duration_hours, image_url, translations } = body

    // Оновлюємо послугу
    const { error: serviceError } = await supabase
      .from("services")
      .update({
        slug,
        position,
        warranty_months,
        duration_hours,
        image_url,
      })
      .eq("id", id)

    if (serviceError) {
      console.error("Error updating service:", serviceError)
      return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
    }

    // Видаляємо старі переклади
    await supabase.from("services_translations").delete().eq("service_id", id)

    // Створюємо нові переклади
    const translationInserts = Object.entries(translations).map(([locale, translation]: [string, any]) => ({
      service_id: id,
      locale,
      name: translation.name,
      description: translation.description,
      detailed_description: translation.detailed_description,
      what_included: translation.what_included,
      benefits: translation.benefits,
    }))

    const { error: translationsError } = await supabase.from("services_translations").insert(translationInserts)

    if (translationsError) {
      console.error("Error updating translations:", translationsError)
      return NextResponse.json({ error: "Failed to update translations" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in PUT /api/admin/services/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { id } = params

    // Видаляємо переклади
    await supabase.from("services_translations").delete().eq("service_id", id)

    // Видаляємо послугу
    const { error } = await supabase.from("services").delete().eq("id", id)

    if (error) {
      console.error("Error deleting service:", error)
      return NextResponse.json({ error: "Failed to delete service" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/admin/services/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
