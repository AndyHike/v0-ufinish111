import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const url = new URL(request.url)
    const locale = url.searchParams.get("locale") || "uk"
    const { slug } = params

    const supabase = createClient()

    // Try to find by slug first, then by ID
    let { data: service, error } = await supabase
      .from("services")
      .select(`
        id, 
        position,
        slug,
        icon,
        services_translations!inner(
          name,
          description,
          locale
        )
      `)
      .eq("services_translations.locale", locale)
      .eq("slug", slug)
      .single()

    // If not found by slug, try by ID
    if (!service) {
      const { data, error: idError } = await supabase
        .from("services")
        .select(`
          id, 
          position,
          slug,
          icon,
          services_translations!inner(
            name,
            description,
            locale
          )
        `)
        .eq("services_translations.locale", locale)
        .eq("id", slug)
        .single()

      service = data
      error = idError
    }

    if (error || !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Transform the data
    const transformedService = {
      id: service.id,
      position: service.position,
      slug: service.slug,
      icon: service.icon,
      name: service.services_translations[0]?.name || "",
      description: service.services_translations[0]?.description || "",
    }

    return NextResponse.json(transformedService)
  } catch (error) {
    console.error("Error fetching service:", error)
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 })
  }
}
