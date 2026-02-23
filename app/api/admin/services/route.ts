import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    console.log("[v0] Fetching services from admin API...")

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
      console.error("[v0] Supabase error fetching services:", error.message, error.details)
      return NextResponse.json(
        { error: `Failed to fetch services: ${error.message}` },
        { status: 500 }
      )
    }

    console.log("[v0] Successfully fetched", services?.length || 0, "services")
    if (services && services.length > 0) {
      console.log("[v0] First service:", services[0])
    }

    return NextResponse.json({ services: services || [] })
  } catch (error) {
    console.error("[v0] Error in GET /api/admin/services:", error)
    return NextResponse.json(
      {
        error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    )
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
