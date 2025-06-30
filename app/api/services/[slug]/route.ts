import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params
    const url = new URL(request.url)
    const locale = url.searchParams.get("locale") || "uk"

    const supabase = createClient()

    // Try to find service by slug first, then by ID
    const { data: service, error } = await supabase
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
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .single()

    if (error || !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Get related models for this service
    const { data: modelServices } = await supabase
      .from("model_services")
      .select(`
        id,
        price,
        model_id,
        models(
          id,
          name,
          slug,
          image_url,
          brands(
            id,
            name,
            slug,
            logo_url
          )
        )
      `)
      .eq("service_id", service.id)
      .order("models(name)", { ascending: true })

    // Calculate service statistics
    const prices = modelServices?.map((ms) => ms.price).filter((p) => p !== null) || []
    const stats = {
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      modelsCount: modelServices?.length || 0,
      brandsCount: new Set(modelServices?.map((ms) => ms.models?.brands?.id)).size || 0,
    }

    const serviceData = {
      id: service.id,
      slug: service.slug,
      icon: service.icon || "wrench",
      position: service.position,
      name: service.services_translations[0]?.name || "",
      description: service.services_translations[0]?.description || "",
      stats,
      relatedModels:
        modelServices?.map((ms) => ({
          id: ms.id,
          price: ms.price,
          model: {
            id: ms.models?.id,
            name: ms.models?.name,
            slug: ms.models?.slug,
            image_url: ms.models?.image_url,
            brand: {
              id: ms.models?.brands?.id,
              name: ms.models?.brands?.name,
              slug: ms.models?.brands?.slug,
              logo_url: ms.models?.brands?.logo_url,
            },
          },
        })) || [],
    }

    return NextResponse.json(serviceData)
  } catch (error) {
    console.error("Error fetching service:", error)
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 })
  }
}
