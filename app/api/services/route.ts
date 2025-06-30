import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const locale = url.searchParams.get("locale") || "uk"

    const supabase = createClient()

    // Fetch services with translations
    const { data, error } = await supabase
      .from("services")
      .select(`
        id, 
        slug,
        icon,
        position,
        services_translations!inner(
          name,
          description,
          locale
        )
      `)
      .eq("services_translations.locale", locale)
      .order("position", { ascending: true })

    if (error) throw error

    // Transform the data to a more usable format and add stats
    const transformedData = await Promise.all(
      data.map(async (service) => {
        // Get stats for each service
        const { data: modelServices } = await supabase
          .from("model_services")
          .select("price")
          .eq("service_id", service.id)

        const prices = modelServices?.map((ms) => ms.price).filter((p) => p !== null) || []
        const stats = {
          minPrice: prices.length > 0 ? Math.min(...prices) : 0,
          modelsCount: modelServices?.length || 0,
        }

        return {
          id: service.id,
          slug: service.slug,
          icon: service.icon || "wrench",
          position: service.position,
          name: service.services_translations[0]?.name || "",
          description: service.services_translations[0]?.description || "",
          stats,
        }
      }),
    )

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}
