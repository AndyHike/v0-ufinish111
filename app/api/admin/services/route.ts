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

    console.log("Received service data:", body)

    const { slug, position, warranty_months, duration_hours, image_url, translations } = body

    // Валідація обов'язкових полів
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }

    if (!translations || typeof translations !== "object") {
      return NextResponse.json({ error: "Translations are required" }, { status: 400 })
    }

    // Перевіряємо чи є хоча б один переклад з назвою
    const hasValidTranslation = Object.values(translations).some((t: any) => t?.name?.trim())
    if (!hasValidTranslation) {
      return NextResponse.json({ error: "At least one translation with name is required" }, { status: 400 })
    }

    // Отримуємо назву з першого доступного перекладу для поля name в services
    const firstTranslation = Object.values(translations).find((t: any) => t?.name?.trim()) as any
    const serviceName = firstTranslation?.name || slug

    // Створюємо послугу з назвою
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .insert({
        slug,
        name: serviceName, // Додаємо назву послуги
        position: position || 0,
        warranty_months: warranty_months || 6,
        duration_hours: duration_hours || 2,
        image_url: image_url || null,
      })
      .select()
      .single()

    if (serviceError) {
      console.error("Error creating service:", serviceError)
      return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
    }

    console.log("Created service:", service)

    // Створюємо переклади
    const translationInserts = Object.entries(translations)
      .filter(([_, translation]: [string, any]) => translation?.name?.trim()) // Фільтруємо тільки переклади з назвою
      .map(([locale, translation]: [string, any]) => ({
        service_id: service.id,
        locale,
        name: translation.name.trim(),
        description: translation.description?.trim() || "",
        detailed_description: translation.detailed_description?.trim() || null,
        what_included: translation.what_included?.trim() || null,
        benefits: translation.benefits?.trim() || null,
      }))

    console.log("Translation inserts:", translationInserts)

    if (translationInserts.length === 0) {
      // Видаляємо створену послугу якщо немає валідних перекладів
      await supabase.from("services").delete().eq("id", service.id)
      return NextResponse.json({ error: "No valid translations provided" }, { status: 400 })
    }

    const { error: translationsError } = await supabase.from("services_translations").insert(translationInserts)

    if (translationsError) {
      console.error("Error creating translations:", translationsError)
      // Видаляємо створену послугу якщо переклади не створилися
      await supabase.from("services").delete().eq("id", service.id)
      return NextResponse.json({ error: "Failed to create translations" }, { status: 500 })
    }

    console.log("Service created successfully:", service.id)

    return NextResponse.json({ service })
  } catch (error) {
    console.error("Error in POST /api/admin/services:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
