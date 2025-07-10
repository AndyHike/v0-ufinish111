import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get("locale") || "uk"

    const { data: services, error } = await supabase
      .from("services")
      .select(`
        id,
        slug,
        name,
        position,
        warranty_months,
        duration_hours,
        image_url,
        created_at,
        services_translations!inner(
          locale,
          name,
          description,
          detailed_description,
          what_included,
          benefits
        )
      `)
      .eq("services_translations.locale", locale)
      .order("position", { ascending: true })

    if (error) {
      console.error("Error fetching services:", error)
      return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
    }

    // Трансформуємо дані для зручності використання
    const transformedServices =
      services?.map((service) => ({
        id: service.id,
        slug: service.slug,
        name: service.name,
        position: service.position,
        warranty_months: service.warranty_months,
        duration_hours: service.duration_hours,
        image_url: service.image_url,
        created_at: service.created_at,
        // Беремо перший переклад (оскільки фільтруємо по locale)
        translation: service.services_translations?.[0] || {
          name: service.name,
          description: "",
          detailed_description: null,
          what_included: null,
          benefits: null,
        },
      })) || []

    return NextResponse.json(transformedServices)
  } catch (error) {
    console.error("Error in GET /api/admin/services:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    console.log("Creating service with data:", body)

    const { slug, position, warranty_months, duration_hours, image_url, translations } = body

    // Перевіряємо, що translations є об'єктом
    if (!translations || typeof translations !== "object") {
      return NextResponse.json({ error: "Translations are required" }, { status: 400 })
    }

    // Отримуємо назву з першого доступного перекладу
    const translationEntries = Object.entries(translations)
    const firstTranslation = translationEntries.find(([_, translation]: [string, any]) => translation?.name?.trim())

    if (!firstTranslation) {
      return NextResponse.json({ error: "At least one translation with name is required" }, { status: 400 })
    }

    const serviceName = (firstTranslation[1] as any).name.trim()

    // Створюємо послугу
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .insert({
        slug: slug?.trim() || null,
        name: serviceName,
        position: position || 0,
        warranty_months: warranty_months || 6,
        duration_hours: duration_hours || 2,
        image_url: image_url?.trim() || null,
      })
      .select()
      .single()

    if (serviceError) {
      console.error("Error creating service:", serviceError)
      return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
    }

    // Створюємо переклади
    const translationInserts = translationEntries
      .filter(([_, translation]: [string, any]) => translation?.name?.trim())
      .map(([locale, translation]: [string, any]) => ({
        service_id: service.id,
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
        console.error("Error creating translations:", translationsError)
        // Видаляємо створену послугу якщо переклади не створились
        await supabase.from("services").delete().eq("id", service.id)
        return NextResponse.json({ error: "Failed to create translations" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, service })
  } catch (error) {
    console.error("Error in POST /api/admin/services:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
