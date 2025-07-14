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
    const nameColumn = `name_${locale}`

    console.log(`🔍 Searching for "${searchTerm}" in locale "${locale}"`)

    // Пошук моделей (пріоритет 1)
    const { data: models } = await supabase
      .from("models")
      .select(`
        id,
        slug,
        ${nameColumn},
        brands!inner(
          id,
          slug,
          ${nameColumn}
        ),
        series!inner(
          id,
          slug,
          ${nameColumn}
        )
      `)
      .ilike(nameColumn, `%${searchTerm}%`)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(4)

    // Пошук брендів (пріоритет 2)
    const { data: brands } = await supabase
      .from("brands")
      .select(`id, slug, ${nameColumn}`)
      .ilike(nameColumn, `%${searchTerm}%`)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(3)

    // Пошук лінійок (пріоритет 3)
    const { data: series } = await supabase
      .from("series")
      .select(`
        id,
        slug,
        ${nameColumn},
        brands!inner(
          id,
          slug,
          ${nameColumn}
        )
      `)
      .ilike(nameColumn, `%${searchTerm}%`)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(3)

    // Пошук послуг (пріоритет 4)
    const { data: services } = await supabase
      .from("services")
      .select(`id, slug, ${nameColumn}`)
      .ilike(nameColumn, `%${searchTerm}%`)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(3)

    // Форматування результатів
    const results = {
      models:
        models?.map((model) => ({
          id: model.id,
          type: "model",
          name: model[nameColumn],
          slug: model.slug,
          url: `/${locale}/models/${model.slug}`,
          breadcrumb: `${model.brands[nameColumn]} › ${model.series[nameColumn]}`,
        })) || [],

      brands:
        brands?.map((brand) => ({
          id: brand.id,
          type: "brand",
          name: brand[nameColumn],
          slug: brand.slug,
          url: `/${locale}/brands/${brand.slug}`,
          breadcrumb: null,
        })) || [],

      series:
        series?.map((serie) => ({
          id: serie.id,
          type: "series",
          name: serie[nameColumn],
          slug: serie.slug,
          url: `/${locale}/series/${serie.slug}`,
          breadcrumb: serie.brands[nameColumn],
        })) || [],

      services:
        services?.map((service) => ({
          id: service.id,
          type: "service",
          name: service[nameColumn],
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
