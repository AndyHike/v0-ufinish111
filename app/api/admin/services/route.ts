import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const locale = url.searchParams.get("locale") || "uk"

    console.log(`[GET] /api/admin/services - Fetching services for locale: ${locale}`)

    const supabase = createClient()

    // Fetch services with translations
    const { data, error } = await supabase
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
      .order("position", { ascending: true })

    if (error) {
      console.error("[GET] /api/admin/services - Error fetching services:", error)
      return NextResponse.json({ error: "Failed to fetch services", details: error }, { status: 500 })
    }

    console.log(`[GET] /api/admin/services - Found ${data.length} services`)

    // Filter translations for the requested locale
    const transformedData = data.map((service) => {
      const translations = service.services_translations.filter((translation: any) => translation.locale === locale)

      return {
        id: service.id,
        position: service.position,
        name: translations[0]?.name || "",
        description: translations[0]?.description || "",
      }
    })

    console.log(`[GET] /api/admin/services - Transformed ${transformedData.length} services for locale ${locale}`)
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("[GET] /api/admin/services - Unexpected error:", error)
    return NextResponse.json({ error: "Failed to fetch services", details: error }, { status: 500 })
  }
}
