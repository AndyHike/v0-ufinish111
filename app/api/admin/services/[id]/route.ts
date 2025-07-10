import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { id } = params

    const { data: service, error } = await supabase
      .from("services")
      .select(`
        id,
        slug,
        name,
        position,
        warranty_months,
        duration_hours,
        image_url,
        services_translations(
          id,
          locale,
          name,
          description,
          detailed_description,
          what_included,
          benefits
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching service:", error)
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error("Error in GET /api/admin/services/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { id } = params
    const body = await request.json()

    console.log("Updating service:", id, body)

    const { slug, position, warranty_months, duration_hours, image_url, translations } = body

    // Перевіряємо, що translations є об'єктом або масивом
    let translationEntries: [string, any][] = []

    if (translations) {
      if (Array.isArray(translations)) {
        // Якщо це масив, конвертуємо в entries
        translationEntries = translations.map((t) => [t.locale, t])
      } else if (typeof translations === "object") {
        // Якщо це об'єкт, отримуємо entries
        translationEntries = Object.entries(translations)
      }
    }

    // Отримуємо назву з першого доступного перекладу
    const firstTranslation = translationEntries.find(([_, translation]: [string, any]) => translation?.name?.trim())

    const serviceName = firstTranslation ? (firstTranslation[1] as any).name.trim() : slug || "Unnamed Service"

    // Оновлюємо основну інформацію про послугу
    const { error: serviceError } = await supabase
      .from("services")
      .update({
        slug: slug?.trim() || null,
        name: serviceName,
        position: position || 0,
        warranty_months: warranty_months || 6,
        duration_hours: duration_hours || 2,
        image_url: image_url?.trim() || null,
      })
      .eq("id", id)

    if (serviceError) {
      console.error("Error updating service:", serviceError)
      return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
    }

    // Оновлюємо переклади
    if (translationEntries.length > 0) {
      // Видаляємо старі переклади
      await supabase.from("services_translations").delete().eq("service_id", id)

      // Додаємо нові переклади
      const translationInserts = translationEntries
        .filter(([_, translation]: [string, any]) => translation?.name?.trim())
        .map(([locale, translation]: [string, any]) => ({
          service_id: id,
          locale,
          name: translation.name.trim(),
          description: translation.description?.trim() || "",
          detailed_description: translation.detailed_description?.trim() || null,
          what_included: translation.what_included?.trim() || null,
          benefits: translation.benefits?.trim() || null,
        }))

      if (translationInserts.length > 0) {
        const { error: translationsError } = await supabase.from("services_translations").insert(translationInserts)

        if (translationsError) {
          console.error("Error updating translations:", translationsError)
          return NextResponse.json({ error: "Failed to update translations" }, { status: 500 })
        }
      }
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

    // Спочатку видаляємо переклади
    await supabase.from("services_translations").delete().eq("service_id", id)

    // Потім видаляємо саму послугу
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
