import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const locale = searchParams.get("locale") || "cs"

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.toLowerCase().trim()

    console.log(`🔍 Searching for "${searchTerm}" in locale "${locale}"`)

    // Пошук моделей (пріоритет 1) - тільки англійська назва
    const { data: models, error: modelsError } = await supabase
      .from("models")
      .select(`
        id,
        slug,
        name,
        brands!inner(
          id,
          slug,
          name
        ),
        series!inner(
          id,
          slug,
          name
        )
      `)
      .ilike("name", `%${searchTerm}%`)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(4)

    if (modelsError) {
      console.error("❌ Models search error:", modelsError)
    }

    // Пошук брендів (пріоритет 2) - тільки англійська назва
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select(`id, slug, name`)
      .ilike("name", `%${searchTerm}%`)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(3)

    if (brandsError) {
      console.error("❌ Brands search error:", brandsError)
    }

    // Пошук лінійок (пріоритет 3) - тільки англійська назва
    const { data: series, error: seriesError } = await supabase
      .from("series")
      .select(`
        id,
        slug,
        name,
        brands!inner(
          id,
          slug,
          name
        )
      `)
      .ilike("name", `%${searchTerm}%`)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(3)

    if (seriesError) {
      console.error("❌ Series search error:", seriesError)
    }

    // Пошук послуг (пріоритет 4) - мультимовний пошук
    const serviceNameColumn = `name_${locale}`
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select(`id, slug, ${serviceNameColumn}`)
      .ilike(serviceNameColumn, `%${searchTerm}%`)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(3)

    if (servicesError) {
      console.error("❌ Services search error:", servicesError)
    }

    // Форматування результатів
    const results = {
      models:
        models?.map((model) => ({
          id: model.id,
          type: "model",
          name: model.name,
          slug: model.slug,
          url: `/${locale}/models/${model.slug}`,
          breadcrumb: `${model.brands.name} › ${model.series.name}`,
        })) || [],

      brands:
        brands?.map((brand) => ({
          id: brand.id,
          type: "brand",
          name: brand.name,
          slug: brand.slug,
          url: `/${locale}/brands/${brand.slug}`,
          breadcrumb: null,
        })) || [],

      series:
        series?.map((serie) => ({
          id: serie.id,
          type: "series",
          name: serie.name,
          slug: serie.slug,
          url: `/${locale}/series/${serie.slug}`,
          breadcrumb: serie.brands.name,
        })) || [],

      services:
        services?.map((service) => ({
          id: service.id,
          type: "service",
          name: service[serviceNameColumn],
          slug: service.slug,
          url: `/${locale}/services/${service.slug}`,
          breadcrumb: null,
        })) || [],
    }

    const totalResults = results.models.length + results.brands.length + results.series.length + results.services.length

    console.log(`✅ Found ${totalResults} results:`, {
      models: results.models.length,
      brands: results.brands.length,
      series: results.series.length,
      services: results.services.length,
    })

    return NextResponse.json({ results, totalResults })
  } catch (error) {
    console.error("❌ Search API error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
