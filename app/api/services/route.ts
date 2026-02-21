import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const locale = url.searchParams.get("locale") || "uk"
    const limit = parseInt(url.searchParams.get("limit") || "1000")

    const supabase = createClient()

    // Fetch services with translations
    const { data, error } = await supabase
      .from("services")
      .select(`
        id, 
        slug,
        position,
        services_translations!inner(
          name,
          description,
          locale
        )
      `)
      .eq("services_translations.locale", locale)
      .order("position", { ascending: true })
      .limit(limit)

    if (error) throw error

    // Transform the data to a more usable format
    const transformedData = data.map((service) => ({
      id: service.id,
      slug: service.slug,
      position: service.position,
      title: service.services_translations[0]?.name || "",
      description: service.services_translations[0]?.description || "",
    }))

    return NextResponse.json({ services: transformedData })
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}
